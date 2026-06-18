import datetime
from django.db import models
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    StudentProfile, HRProfile, HRVerification, InterviewSlot, Booking, Payment, Meeting, Review,
    ResumeAnalysis, InterviewAnalysis, SkillGapReport, CareerGuidance, LearningRoadmap,
    HRAssessment, Wallet, WalletTransaction, ContactSubmission
)
from .services import calculate_student_completion_percentage
from core.validators import (
    validate_student_resume,
    validate_hr_resume,
    validate_hr_id_card,
    validate_hr_experience_letter,
    validate_hr_profile_photo
)

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'full_name': self.user.full_name,
            'role': self.user.role,
            'phone_number': self.user.phone_number,
        }
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone_number', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'role', 'is_active', 'created_at']

class StudentRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone_number', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        validated_data['role'] = 'student'
        user = User.objects.create(**validated_data)
        # Create profile
        StudentProfile.objects.create(user=user)
        return user

class HRRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone_number', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        validated_data['role'] = 'hr'
        user = User.objects.create(**validated_data)
        # Create profile and verification records
        HRProfile.objects.create(user=user)
        HRVerification.objects.create(hr=user, verification_status='pending')
        return user

# Student Workspace Serializers
class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    resume = serializers.FileField(required=False, allow_null=True, validators=[validate_student_resume])

    class Meta:
        model = StudentProfile
        fields = ['id', 'user', 'college_name', 'degree', 'branch', 'graduation_year', 'skills', 'career_goal', 'resume', 'profile_completion']
        read_only_fields = ['id', 'user', 'profile_completion']

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        calculate_student_completion_percentage(instance)
        return instance

# HR Workspace Serializers
class HRProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    profile_photo = serializers.ImageField(required=False, allow_null=True, validators=[validate_hr_profile_photo])

    class Meta:
        model = HRProfile
        fields = ['id', 'user', 'company_name', 'designation', 'years_of_experience', 'bio', 'linkedin_url', 'profile_photo', 'date_of_birth', 'ticked_skills', 'professional_qualities']
        read_only_fields = ['id', 'user']

class HRVerificationSerializer(serializers.ModelSerializer):
    resume_file = serializers.FileField(required=False, allow_null=True, validators=[validate_hr_resume])
    employee_id_file = serializers.FileField(required=False, allow_null=True, validators=[validate_hr_id_card])
    experience_letter = serializers.FileField(required=False, allow_null=True, validators=[validate_hr_experience_letter])
    pay_slips_file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = HRVerification
        fields = ['id', 'resume_file', 'employee_id_file', 'experience_letter', 'pay_slips_file', 'verification_status', 'admin_notes']
        read_only_fields = ['id', 'verification_status', 'admin_notes']

# Admin Serializers
class HRVerificationAdminSerializer(serializers.ModelSerializer):
    hr_details = UserSerializer(source='hr', read_only=True)
    hr_profile = HRProfileSerializer(source='hr.hr_profile', read_only=True)

    class Meta:
        model = HRVerification
        fields = ['id', 'hr', 'hr_details', 'hr_profile', 'resume_file', 'employee_id_file', 'experience_letter', 'verification_status', 'admin_notes']
        read_only_fields = ['id', 'hr', 'resume_file', 'employee_id_file', 'experience_letter']

# --- PHASE 2 SERIALIZERS ---

class InterviewSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSlot
        fields = ['id', 'hr', 'date', 'start_time', 'end_time', 'duration', 'price', 'status', 'meeting_link', 'created_at']
        read_only_fields = ['id', 'hr', 'created_at', 'status']

    def validate_date(self, value):
        """Reject slots scheduled in the past."""
        if value < datetime.date.today():
            raise serializers.ValidationError("Interview slot date cannot be in the past.")
        return value

    def validate(self, data):
        """Ensure start_time is before end_time."""
        start = data.get('start_time')
        end = data.get('end_time')
        if start and end and start >= end:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})
        return data

class ReviewSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'booking', 'student', 'student_name', 'hr', 'rating', 'comment', 'created_at',
            'knowledge_rating', 'communication_rating', 'professionalism_rating', 'helpfulness_rating',
            'student_preparation_rating', 'student_communication_rating', 'student_technical_rating', 'student_attitude_rating'
        ]
        read_only_fields = ['id', 'student', 'hr', 'created_at']

class HRPublicProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    slots = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = HRProfile
        fields = ['id', 'user_details', 'company_name', 'designation', 'years_of_experience', 'bio', 'linkedin_url', 'profile_photo', 'slots', 'reviews', 'average_rating']

    def get_slots(self, obj):
        import datetime
        now_date = datetime.date.today()
        # Return upcoming available slots
        slots_qs = InterviewSlot.objects.filter(hr=obj.user, status='available', date__gte=now_date).order_by('date', 'start_time')
        return InterviewSlotSerializer(slots_qs, many=True).data

    def get_reviews(self, obj):
        reviews_qs = Review.objects.filter(hr=obj.user).order_by('-created_at')
        return ReviewSerializer(reviews_qs, many=True).data

    def get_average_rating(self, obj):
        avg = Review.objects.filter(hr=obj.user).aggregate(models.Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0.0

class BookingSerializer(serializers.ModelSerializer):
    student_details = UserSerializer(source='student', read_only=True)
    hr_details = UserSerializer(source='hr', read_only=True)
    slot_details = InterviewSlotSerializer(source='slot', read_only=True)
    meeting_link = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = ['id', 'student', 'student_details', 'hr', 'hr_details', 'slot', 'slot_details', 'booking_status', 'payment_status', 'booked_at', 'meeting_link']
        read_only_fields = ['id', 'student', 'hr', 'booking_status', 'payment_status', 'booked_at', 'meeting_link']

    def get_meeting_link(self, obj):
        # Prefer the HR-provided meeting link on the slot
        if obj.slot and obj.slot.meeting_link:
            return obj.slot.meeting_link
        # Fall back to auto-generated Meeting model link
        try:
            return obj.meeting.meeting_link
        except:
            return None

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'booking', 'razorpay_order_id', 'razorpay_payment_id', 'amount', 'currency', 'payment_status']
        read_only_fields = ['id', 'booking', 'razorpay_order_id', 'razorpay_payment_id', 'amount', 'currency', 'payment_status']


# --- Phase 3 Serializers ---

class ResumeAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeAnalysis
        fields = ['id', 'student', 'resume_score', 'strengths', 'weaknesses', 'recommendations', 'created_at']

class InterviewAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewAnalysis
        fields = ['id', 'booking', 'technical_score', 'communication_score', 'behavioral_score', 'strengths', 'weaknesses', 'recommendations', 'created_at']

class SkillGapReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillGapReport
        fields = ['id', 'student', 'target_role', 'missing_skills', 'readiness_score', 'recommended_path', 'created_at']

class CareerGuidanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerGuidance
        fields = ['id', 'student', 'recommended_roles', 'readiness_score', 'improvement_areas', 'created_at']

class LearningRoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningRoadmap
        fields = ['id', 'student', 'target_role', 'roadmap_data', 'created_at']


class HRAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = HRAssessment
        fields = ['id', 'hr', 'questions', 'answers', 'score', 'feedback', 'is_passed', 'completed_at']
        read_only_fields = ['id', 'hr', 'questions', 'score', 'feedback', 'is_passed', 'completed_at']


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = ['id', 'amount', 'transaction_type', 'status', 'created_at']


class WalletSerializer(serializers.ModelSerializer):
    transactions = WalletTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Wallet
        fields = ['id', 'balance', 'promo_credits', 'transactions']
        read_only_fields = ['id', 'balance', 'promo_credits', 'transactions']


class ContactSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactSubmission
        fields = ['id', 'name', 'email', 'subject', 'message', 'status', 'admin_reply', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'admin_reply', 'created_at', 'updated_at']


class AdminContactSubmissionSerializer(serializers.ModelSerializer):
    """Admin-facing serializer allowing status updates."""
    class Meta:
        model = ContactSubmission
        fields = ['id', 'name', 'email', 'subject', 'message', 'status', 'admin_reply', 'created_at', 'updated_at']
