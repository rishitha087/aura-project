import datetime
from decimal import Decimal
import random
import string
import hmac
import hashlib
import os
import logging

from django.db.models import Avg, Min, Max, Q
from django.core.exceptions import PermissionDenied
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import (
    StudentProfile, HRProfile, HRVerification, InterviewSlot, Booking, Payment, Meeting, Review,
    ResumeAnalysis, InterviewAnalysis, SkillGapReport, CareerGuidance, LearningRoadmap,
    HRAssessment, Wallet, WalletTransaction, ContactSubmission
)
from .serializers import (
    CustomTokenObtainPairSerializer,
    StudentRegisterSerializer,
    HRRegisterSerializer,
    UserSerializer,
    StudentProfileSerializer,
    HRProfileSerializer,
    HRVerificationSerializer,
    HRVerificationAdminSerializer,
    InterviewSlotSerializer,
    ReviewSerializer,
    HRPublicProfileSerializer,
    BookingSerializer,
    PaymentSerializer,
    ResumeAnalysisSerializer,
    InterviewAnalysisSerializer,
    SkillGapReportSerializer,
    CareerGuidanceSerializer,
    LearningRoadmapSerializer,
    HRAssessmentSerializer,
    WalletSerializer,
    WalletTransactionSerializer,
    ContactSubmissionSerializer,
    AdminContactSubmissionSerializer,
)
from core.permissions import IsStudent, IsHR, IsAdminUserRole
from .services import calculate_student_completion_percentage
from .ai_services import (
    parse_and_analyze_resume,
    generate_interview_report,
    analyze_skill_gap_and_roadmap,
    get_career_guidance_report,
    get_ai_coach_response,
    generate_hr_assessment_questions,
    evaluate_hr_assessment_answers
)

User = get_user_model()

# --- Auth Views ---
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class StudentRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = StudentRegisterSerializer
    permission_classes = [permissions.AllowAny]

class HRRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = HRRegisterSerializer
    permission_classes = [permissions.AllowAny]

class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

# --- Student Profile Views ---
class StudentProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get_object(self):
        profile, created = StudentProfile.objects.get_or_create(user=self.request.user)
        return profile

class StudentResumeUploadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        profile, created = StudentProfile.objects.get_or_create(user=request.user)
        
        if 'resume' not in request.FILES:
            return Response({"resume": "No file was submitted."}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = StudentProfileSerializer(profile, data=request.FILES, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- HR Profile & Verification Views ---
class HRProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = HRProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsHR]

    def get_object(self):
        profile, created = HRProfile.objects.get_or_create(user=self.request.user)
        return profile

class HRProfilePhotoUploadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsHR]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        profile, created = HRProfile.objects.get_or_create(user=request.user)
        
        if 'profile_photo' not in request.FILES:
            return Response({"profile_photo": "No photo was submitted."}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = HRProfileSerializer(profile, data=request.FILES, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class HRVerificationUploadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsHR]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, *args, **kwargs):
        verification, created = HRVerification.objects.get_or_create(hr=request.user)
        serializer = HRVerificationSerializer(verification)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        verification, created = HRVerification.objects.get_or_create(hr=request.user)
        
        serializer = HRVerificationSerializer(verification, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(verification_status='pending')  # Re-evaluate as pending upon doc changes
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- Admin Views ---
class AdminUserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get_queryset(self):
        queryset = User.objects.exclude(role='admin')
        role = self.request.query_params.get('role', None)
        if role in ['student', 'hr']:
            queryset = queryset.filter(role=role)
        return queryset.order_by('-created_at')

class AdminHRVerificationListView(generics.ListAPIView):
    serializer_class = HRVerificationAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get_queryset(self):
        queryset = HRVerification.objects.all()
        status_param = self.request.query_params.get('status', None)
        if status_param in ['pending', 'approved', 'rejected']:
            queryset = queryset.filter(verification_status=status_param)
        return queryset.order_by('id')

class AdminHRVerificationApproveRejectView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def patch(self, request, pk, *args, **kwargs):
        try:
            verification = HRVerification.objects.select_related('hr').get(pk=pk)
        except HRVerification.DoesNotExist:
            return Response({"detail": "Verification request not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('verification_status')
        admin_notes = request.data.get('admin_notes', '')

        if new_status not in ['approved', 'rejected', 'pending']:
            return Response(
                {"verification_status": "Status must be 'approved', 'rejected', or 'pending'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        verification.verification_status = new_status
        verification.admin_notes = admin_notes
        verification.save()

        # Sync HR user active status with verification
        hr_user = verification.hr
        if new_status == 'approved':
            hr_user.is_active = True
        elif new_status == 'rejected':
            hr_user.is_active = False
        # 'pending' does not change is_active
        hr_user.save(update_fields=['is_active'])

        serializer = HRVerificationAdminSerializer(verification)
        return Response(serializer.data, status=status.HTTP_200_OK)

# --- PHASE 2 VIEWS ---

# Slot availability
class HRSlotListCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsHR]

    def get(self, request):
        slots = InterviewSlot.objects.filter(hr=request.user).order_by('-date', '-start_time')
        serializer = InterviewSlotSerializer(slots, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Business rule: Must be verified HR
        try:
            verification = HRVerification.objects.get(hr=request.user)
            if verification.verification_status != 'approved':
                return Response(
                    {"detail": "Your HR account is not verified yet. Slot creation is locked."},
                    status=status.HTTP_403_FORBIDDEN
                )
        except HRVerification.DoesNotExist:
            return Response(
                {"detail": "Verification records not found."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = InterviewSlotSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(hr=request.user, status='available')
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class HRSlotDestroyView(generics.DestroyAPIView):
    queryset = InterviewSlot.objects.all()
    serializer_class = InterviewSlotSerializer
    permission_classes = [permissions.IsAuthenticated, IsHR]

    def get_object(self):
        obj = super().get_object()
        # Ownership check: only the HR who created the slot can delete it
        if obj.hr != self.request.user:
            raise PermissionDenied("You can only delete your own interview slots.")
        return obj

    def perform_destroy(self, instance):
        if instance.status != 'available':
            raise views.exceptions.ValidationError("Cannot delete slots that have already been booked or cancelled.")
        instance.delete()

# Student Discovery
class StudentHRDiscoveryListView(generics.ListAPIView):
    serializer_class = HRPublicProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get_queryset(self):
        queryset = HRProfile.objects.filter(user__hr_verification__verification_status='approved')
        
        # Search parameters
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(user__full_name__icontains=search) |
                Q(company_name__icontains=search) |
                Q(designation__icontains=search) |
                Q(bio__icontains=search)
            )

        # Filters
        skills = self.request.query_params.get('skills', None)
        if skills:
            queryset = queryset.filter(bio__icontains=skills) # Fallback search bio for matching tag strings
            
        exp_min = self.request.query_params.get('exp_min', None)
        if exp_min:
            try:
                queryset = queryset.filter(years_of_experience__gte=int(exp_min))
            except (ValueError, TypeError):
                pass

        price_max = self.request.query_params.get('price_max', None)
        if price_max:
            try:
                # Filter HRs who have at least one slot under the maximum price
                queryset = queryset.filter(user__slots__price__lte=float(price_max)).distinct()
            except (ValueError, TypeError):
                pass

        # Sorting
        sort_by = self.request.query_params.get('sort_by', None)
        if sort_by == 'price_low':
            queryset = queryset.annotate(min_price=Min('user__slots__price')).order_by('min_price')
        elif sort_by == 'price_high':
            queryset = queryset.annotate(max_price=Max('user__slots__price')).order_by('-max_price')
        elif sort_by == 'experience':
            queryset = queryset.order_by('-years_of_experience')
        
        return queryset

class StudentHRDetailView(generics.RetrieveAPIView):
    queryset = HRProfile.objects.filter(user__hr_verification__verification_status='approved')
    serializer_class = HRPublicProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

# Booking
class StudentBookingCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def post(self, request):
        # Business rule 1: profile completeness >= 70%
        try:
            profile = StudentProfile.objects.get(user=request.user)
            if profile.profile_completion < 70:
                return Response(
                    {"detail": f"Profile completion is currently at {profile.profile_completion}%. Setup academics and upload your resume to reach the 70% booking threshold."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except StudentProfile.DoesNotExist:
            return Response(
                {"detail": "Student profile not found."},
                status=status.HTTP_400_BAD_REQUEST
            )

        slot_id = request.data.get('slot_id')
        try:
            slot = InterviewSlot.objects.get(pk=slot_id)
        except InterviewSlot.DoesNotExist:
            return Response({"detail": "Interview slot not found."}, status=status.HTTP_404_NOT_FOUND)

        # Business rule 2: Prevent students from booking their own slots
        if slot.hr == request.user:
            return Response({"detail": "You cannot book your own interview slot."}, status=status.HTTP_400_BAD_REQUEST)

        # Business rule 3: Check slot is available (no double booking)
        if slot.status != 'available':
            return Response({"detail": "This slot has already been booked or is unavailable."}, status=status.HTTP_400_BAD_REQUEST)

        # Create pending booking
        booking = Booking.objects.create(
            student=request.user,
            hr=slot.hr,
            slot=slot,
            booking_status='pending',
            payment_status='pending'
        )

        # Lock the slot temporarily
        slot.status = 'booked'
        slot.save()

        serializer = BookingSerializer(booking)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# Payments Integration
class PaymentCreateOrderView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        try:
            # Ownership check: only the student who made the booking can create an order for it
            booking = Booking.objects.get(pk=booking_id, student=request.user)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking record not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.payment_status == 'success':
            return Response({"detail": "This booking has already been paid."}, status=status.HTTP_400_BAD_REQUEST)

        amount = int(booking.slot.price)
        currency = 'INR'

        # Razorpay integration or mock order fallback
        order_id = f"order_mock_{''.join(random.choices(string.ascii_letters + string.digits, k=14))}"

        # Save payment metadata
        payment, created = Payment.objects.get_or_create(
            booking=booking,
            defaults={
                'razorpay_order_id': order_id,
                'amount': amount,
                'currency': currency,
                'payment_status': 'pending'
            }
        )
        if not created:
            payment.razorpay_order_id = order_id
            payment.save()

        from django.conf import settings as django_settings
        return Response({
            "order_id": order_id,
            "amount": amount * 100,  # In paise for Razorpay
            "currency": currency,
            "key_id": getattr(django_settings, 'RAZORPAY_KEY_ID', 'rzp_test_mockkey')
        })

class PaymentVerifySignatureView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('razorpay_order_id')
        payment_id = request.data.get('razorpay_payment_id')
        signature = request.data.get('razorpay_signature')

        try:
            payment = Payment.objects.get(razorpay_order_id=order_id)
        except Payment.DoesNotExist:
            return Response({"detail": "Payment order mismatch."}, status=status.HTTP_404_NOT_FOUND)

        # Sandbox / Mock payment validator override
        from django.conf import settings as django_settings
        razorpay_secret = getattr(django_settings, 'RAZORPAY_KEY_SECRET', '')
        if signature == 'mock_signature' or not razorpay_secret:
            is_valid = True
        else:
            # Real cryptographic HMAC-SHA256 signature check
            msg = f"{order_id}|{payment_id}"
            # Note: hmac.new() is the correct module-level function call
            generated = hmac.new(
                razorpay_secret.encode('utf-8'),
                msg.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            is_valid = hmac.compare_digest(generated, signature)

        if not is_valid:
            payment.payment_status = 'failed'
            payment.save()
            payment.booking.booking_status = 'cancelled'
            payment.booking.payment_status = 'failed'
            payment.booking.slot.status = 'available' # Unlock slot
            payment.booking.slot.save()
            payment.booking.save()
            return Response({"detail": "Payment verification failed."}, status=status.HTTP_400_BAD_REQUEST)

        # Payment Success Flow
        payment.payment_status = 'success'
        payment.razorpay_payment_id = payment_id
        payment.save()

        booking = payment.booking
        booking.booking_status = 'confirmed'
        booking.payment_status = 'success'
        booking.save()

        # Update slot status
        booking.slot.status = 'booked'
        booking.slot.save()

        # Generate mock Google Meet room link
        room_code = f"{''.join(random.choices(string.ascii_lowercase, k=3))}-" \
                    f"{''.join(random.choices(string.ascii_lowercase, k=4))}-" \
                    f"{''.join(random.choices(string.ascii_lowercase, k=3))}"
        meet_link = f"https://meet.google.com/{room_code}"

        Meeting.objects.create(
            booking=booking,
            meeting_link=meet_link,
            created_by=booking.hr
        )

        return Response({"status": "payment successful", "booking_id": booking.id})

# Session Details & tab lists
class StudentInterviewsListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        status_filter = request.query_params.get('status', 'upcoming')
        bookings = Booking.objects.filter(student=request.user)

        if status_filter == 'upcoming':
            # Include both confirmed and pending (awaiting payment) bookings
            bookings = bookings.filter(
                booking_status__in=['confirmed', 'pending'],
                slot__date__gte=datetime.date.today()
            )
        elif status_filter == 'completed':
            bookings = bookings.filter(Q(booking_status='completed') | Q(booking_status='confirmed', slot__date__lt=datetime.date.today()))
        elif status_filter == 'cancelled':
            bookings = bookings.filter(booking_status='cancelled')

        bookings = bookings.order_by('slot__date', 'slot__start_time')
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

class HRInterviewsListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsHR]

    def get(self, request):
        status_filter = request.query_params.get('status', 'upcoming')
        bookings = Booking.objects.filter(hr=request.user)

        if status_filter == 'upcoming':
            # Include both confirmed and pending bookings
            bookings = bookings.filter(
                booking_status__in=['confirmed', 'pending'],
                slot__date__gte=datetime.date.today()
            )
        elif status_filter == 'completed':
            bookings = bookings.filter(Q(booking_status='completed') | Q(booking_status='confirmed', slot__date__lt=datetime.date.today()))
        elif status_filter == 'cancelled':
            bookings = bookings.filter(booking_status='cancelled')

        bookings = bookings.order_by('slot__date', 'slot__start_time')
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

class SessionDetailsView(generics.RetrieveAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        # Verify requesting user is the student or HR associated with the booking
        if self.request.user != obj.student and self.request.user != obj.hr:
            raise PermissionDenied("You are not authorized to view this session.")
        return obj

class SessionFeedbackSubmitView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsHR]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, hr=request.user)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking session not found."}, status=status.HTTP_404_NOT_FOUND)

        rating = request.data.get('rating')
        comment = request.data.get('comment', '')

        try:
            rating_int = int(rating)
        except (TypeError, ValueError):
            rating_int = 0

        if not rating or rating_int not in [1, 2, 3, 4, 5]:
            return Response({"rating": "Provide a valid rating between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)

        # Create Review
        review, created = Review.objects.get_or_create(
            booking=booking,
            defaults={
                'student': booking.student,
                'hr': request.user,
                'rating': rating_int,
                'comment': comment
            }
        )
        if not created:
            review.rating = rating_int
            review.comment = comment
            review.save()

        # Mark booking completed
        booking.booking_status = 'completed'
        booking.save()

        # Credit HR's wallet
        try:
            hr_wallet, _ = Wallet.objects.get_or_create(user=booking.hr)
            slot_price = Decimal(str(booking.slot.price))
            hr_wallet.balance += slot_price
            hr_wallet.save()
            WalletTransaction.objects.create(
                wallet=hr_wallet,
                amount=slot_price,
                transaction_type='payment_received',
                status='success'
            )
        except Exception as e:
            print(f"Failed to credit HR wallet: {e}")

        serializer = ReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# --- PHASE 3 VIEWS ---

class ResumeAnalysisView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        analysis = ResumeAnalysis.objects.filter(student=request.user).order_by('-created_at').first()
        if not analysis:
            return Response({"detail": "No resume analysis report exists. Please trigger one."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ResumeAnalysisSerializer(analysis)
        return Response(serializer.data)

    def post(self, request):
        try:
            profile = StudentProfile.objects.get(user=request.user)
        except StudentProfile.DoesNotExist:
            return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)

        if not profile.resume:
            return Response({"detail": "No resume file has been uploaded yet. Please upload a PDF or DOCX file first."}, status=status.HTTP_400_BAD_REQUEST)

        # Trigger analysis
        analysis = parse_and_analyze_resume(request.user.id, profile.resume.path)
        if not analysis:
            return Response({"detail": "Resume analysis failed. Try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = ResumeAnalysisSerializer(analysis)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InterviewReportDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(pk=booking_id)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking session not found."}, status=status.HTTP_404_NOT_FOUND)

        # Verify access rights
        if request.user != booking.student and request.user != booking.hr:
            return Response({"detail": "You do not have access authorization for this session."}, status=status.HTTP_403_FORBIDDEN)

        # Fetch or generate report
        try:
            analysis = booking.interview_analysis
        except:
            # Generate dynamically if booking is completed or confirmed
            if booking.booking_status in ['completed', 'confirmed']:
                analysis = generate_interview_report(booking.id)
            else:
                return Response({"detail": "Reports can only be generated for confirmed or completed bookings."}, status=status.HTTP_400_BAD_REQUEST)

        if not analysis:
            return Response({"detail": "AI report generation failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = InterviewAnalysisSerializer(analysis)
        return Response(serializer.data)


class SkillGapAnalysisView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        reports = SkillGapReport.objects.filter(student=request.user).order_by('-created_at')
        serializer = SkillGapReportSerializer(reports, many=True)
        return Response(serializer.data)

    def post(self, request):
        target_role = request.data.get('target_role')
        if not target_role:
            return Response({"target_role": "Target role field must be provided."}, status=status.HTTP_400_BAD_REQUEST)

        report = analyze_skill_gap_and_roadmap(request.user.id, target_role)
        if not report:
            return Response({"detail": "Skill gap report generation failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = SkillGapReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CareerGuidanceView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        report = get_career_guidance_report(request.user.id)
        if not report:
            return Response({"detail": "Guidance details could not be generated."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        serializer = CareerGuidanceSerializer(report)
        return Response(serializer.data)


class RecommendedHRsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        # Fetch all approved HR professionals
        hr_profiles = HRProfile.objects.filter(user__hr_verification__verification_status='approved')
        
        student = request.user
        try:
            profile = student.student_profile
            target_goal = (profile.career_goal or "").lower()
        except:
            target_goal = ""

        recommended = []
        for hr in hr_profiles:
            # Determine matching factor
            match_score = 65  # Base match
            hr_bio = hr.bio.lower()
            hr_designation = hr.designation.lower()
            hr_company = hr.company_name.lower()

            if target_goal:
                goal_words = target_goal.split()
                for word in goal_words:
                    if len(word) > 3:
                        if word in hr_bio or word in hr_designation or word in hr_company:
                            match_score += 10

            # Factor rating
            try:
                avg_rating = Review.objects.filter(hr=hr.user).aggregate(Avg('rating'))['rating__avg']
                if avg_rating:
                    match_score += int(avg_rating * 4)
            except:
                pass

            # Random jitter and cap
            match_score += random.randint(0, 5)
            match_score = min(match_score, 98)

            recommended.append({
                "hr_profile": HRPublicProfileSerializer(hr).data,
                "match_percentage": match_score
            })

        # Sort by match score
        recommended = sorted(recommended, key=lambda x: x["match_percentage"], reverse=True)
        return Response(recommended[:6])  # Top 6 recommendations


class LearningRoadmapView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        roadmap = LearningRoadmap.objects.filter(student=request.user).order_by('-created_at').first()
        if not roadmap:
            return Response({"detail": "No study roadmap found. Generate one by starting a skill gap review."}, status=status.HTTP_404_NOT_FOUND)
        serializer = LearningRoadmapSerializer(roadmap)
        return Response(serializer.data)


class AICoachChatView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def post(self, request):
        message = request.data.get('message')
        history = request.data.get('history', [])
        if not message:
            return Response({"message": "Message content is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Append new message to history
        history.append({"role": "user", "text": message})

        reply = get_ai_coach_response(request.user.id, history)
        return Response({"reply": reply})


class StudentAnalyticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get(self, request):
        # 1. Total interviews completed
        bookings = Booking.objects.filter(student=request.user, booking_status='completed')
        count = bookings.count()

        # 2. Historical scores
        analyses = InterviewAnalysis.objects.filter(booking__student=request.user)
        
        tech_avg = int(analyses.aggregate(Avg('technical_score'))['technical_score__avg'] or 0)
        comm_avg = int(analyses.aggregate(Avg('communication_score'))['communication_score__avg'] or 0)
        behavior_avg = int(analyses.aggregate(Avg('behavioral_score'))['behavioral_score__avg'] or 0)

        # 3. Monthly score trends
        monthly_trend = []
        for i, anal in enumerate(analyses.order_by('created_at')[:8]):
            monthly_trend.append({
                "session_id": anal.booking.id,
                "date": anal.created_at.strftime('%b %d'),
                "technical": anal.technical_score,
                "communication": anal.communication_score,
                "behavioral": anal.behavioral_score,
                "overall": int((anal.technical_score + anal.communication_score + anal.behavioral_score) / 3)
            })

        # 4. Readiness Growth (Readiness score over time from skill gaps)
        readiness_trend = []
        gaps = SkillGapReport.objects.filter(student=request.user).order_by('created_at')[:8]
        for g in gaps:
            readiness_trend.append({
                "target_role": g.target_role,
                "date": g.created_at.strftime('%b %d'),
                "score": g.readiness_score
            })

        return Response({
            "interviews_completed": count,
            "technical_average": tech_avg,
            "communication_average": comm_avg,
            "behavioral_average": behavior_avg,
            "monthly_trend": monthly_trend,
            "readiness_trend": readiness_trend
        })


class HRAnalyticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsHR]

    def get(self, request):
        # 1. Interviews conducted
        bookings = Booking.objects.filter(hr=request.user, booking_status='completed')
        count = bookings.count()

        # 2. Average rating
        reviews = Review.objects.filter(hr=request.user)
        avg_rating = round(reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0, 1)

        # 3. Candidate satisfaction ratio (rating >= 4)
        sat_ratio = 100
        if reviews.exists():
            sat_count = reviews.filter(rating__gte=4).count()
            sat_ratio = int((sat_count / reviews.count()) * 100)

        # 4. Earnings
        earnings = sum(int(b.slot.price) for b in bookings if hasattr(b, 'slot'))

        # 5. Earnings over time
        monthly_earnings = []
        # Group by booking slots month
        for b in bookings.order_by('slot__date')[:12]:
            monthly_earnings.append({
                "date": b.slot.date.strftime('%b %Y'),
                "amount": int(b.slot.price)
            })

        return Response({
            "interviews_conducted": count,
            "average_rating": avg_rating,
            "satisfaction_ratio": sat_ratio,
            "earnings": earnings,
            "monthly_earnings": monthly_earnings
        })


# --- EXTENSION VIEWS ---

class OTPSendView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        contact = request.data.get('email') or request.data.get('phone_number')
        if not contact:
            return Response({"detail": "Email or Phone Number is required."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "success", "message": f"Mock OTP sent to {contact}.", "mock_otp": "123456"})


class OTPVerifyView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        contact = request.data.get('email') or request.data.get('phone_number')
        otp = request.data.get('otp')
        if not contact or not otp:
            return Response({"detail": "Contact and OTP fields are required."}, status=status.HTTP_400_BAD_REQUEST)
        if otp == "123456":
            return Response({"status": "success", "message": "OTP verified successfully."})
        return Response({"detail": "Invalid OTP code."}, status=status.HTTP_400_BAD_REQUEST)


class HRAssessmentGenerateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsHR]

    def post(self, request):
        assessment = generate_hr_assessment_questions(request.user.id)
        if not assessment:
            return Response({"detail": "Failed to generate assessment questions."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        serializer = HRAssessmentSerializer(assessment)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HRAssessmentSubmitView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsHR]

    def post(self, request):
        answers = request.data.get('answers', [])
        if not isinstance(answers, list) or len(answers) != 5:
            return Response({"detail": "A list of exactly 5 answers is required."}, status=status.HTTP_400_BAD_REQUEST)
        assessment = evaluate_hr_assessment_answers(request.user.id, answers)
        if not assessment:
            return Response({"detail": "Failed to evaluate answers."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        serializer = HRAssessmentSerializer(assessment)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WalletDetailsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)


class WalletDepositView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def post(self, request):
        amount = request.data.get('amount')
        if not amount or float(amount) <= 0:
            return Response({"detail": "Provide a valid deposit amount."}, status=status.HTTP_400_BAD_REQUEST)
        amount_decimal = Decimal(str(amount))
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        wallet.balance += amount_decimal
        wallet.save()
        WalletTransaction.objects.create(
            wallet=wallet,
            amount=amount_decimal,
            transaction_type='deposit',
            status='success'
        )
        serializer = WalletSerializer(wallet)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WalletWithdrawView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsHR]

    def post(self, request):
        amount = request.data.get('amount')
        if not amount or float(amount) <= 0:
            return Response({"detail": "Provide a valid withdrawal amount."}, status=status.HTTP_400_BAD_REQUEST)
        amount_decimal = Decimal(str(amount))
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        if wallet.balance < amount_decimal:
            return Response({"detail": "Insufficient funds in your wallet."}, status=status.HTTP_400_BAD_REQUEST)
        wallet.balance -= amount_decimal
        wallet.save()
        WalletTransaction.objects.create(
            wallet=wallet,
            amount=amount_decimal,
            transaction_type='withdrawal',
            status='success'
        )
        serializer = WalletSerializer(wallet)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BookingWalletCheckoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        try:
            booking = Booking.objects.get(pk=booking_id, student=request.user)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking request not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if booking.booking_status != 'pending':
            return Response({"detail": "Booking is not in pending status."}, status=status.HTTP_400_BAD_REQUEST)

        price = booking.slot.price
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        
        if wallet.balance < price:
            return Response({"detail": f"Insufficient wallet balance. Slot costs ₹{price} but you only have ₹{wallet.balance}."}, status=status.HTTP_400_BAD_REQUEST)

        # Deduct student wallet
        wallet.balance -= price
        wallet.save()
        WalletTransaction.objects.create(
            wallet=wallet,
            amount=price,
            transaction_type='payment_sent',
            status='success'
        )

        # Confirm booking
        booking.booking_status = 'confirmed'
        booking.payment_status = 'success'
        booking.save()

        # Confirm slot
        booking.slot.status = 'booked'
        booking.slot.save()

        # Generate Google Meet link
        room_code = f"{''.join(random.choices(string.ascii_lowercase, k=3))}-" \
                    f"{''.join(random.choices(string.ascii_lowercase, k=4))}-" \
                    f"{''.join(random.choices(string.ascii_lowercase, k=3))}"
        meet_link = f"https://meet.google.com/{room_code}"

        Meeting.objects.create(
            booking=booking,
            meeting_link=meet_link,
            created_by=booking.hr
        )

        # Create Payment record as well for unified history
        Payment.objects.create(
            booking=booking,
            razorpay_order_id=f"wallet_{booking_id}",
            razorpay_payment_id=f"wallet_pay_{booking_id}",
            amount=price,
            currency="INR",
            payment_status="success"
        )

        return Response({"status": "success", "detail": "Checkout completed via student wallet balance."})


class LeaderboardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Top Rated & Most Booked HRs
        top_rated = []
        hr_profiles = HRProfile.objects.all()
        for hr in hr_profiles:
            avg = Review.objects.filter(hr=hr.user).aggregate(Avg('rating'))['rating__avg'] or 0.0
            bookings_count = Booking.objects.filter(hr=hr.user, booking_status='completed').count()
            
            top_rated.append({
                "hr_id": hr.user.id,
                "full_name": hr.user.full_name,
                "company_name": hr.company_name,
                "designation": hr.designation,
                "profile_photo": hr.profile_photo.url if hr.profile_photo else None,
                "avg_rating": round(avg, 1),
                "booking_count": bookings_count
            })
        
        top_rated_sorted = sorted(top_rated, key=lambda x: x["avg_rating"], reverse=True)[:5]
        most_booked_sorted = sorted(top_rated, key=lambda x: x["booking_count"], reverse=True)[:5]
        
        return Response({
            "top_rated": top_rated_sorted,
            "most_booked": most_booked_sorted
        })


# ─── CONTACT VIEWS ────────────────────────────────────────────────────────────

class ContactSubmissionCreateView(views.APIView):
    """Public endpoint — anyone can submit a contact message."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ContactSubmissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"detail": "Your message has been received. We will get back to you soon!"},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminContactSubmissionListView(views.APIView):
    """Admin: list all contact submissions with optional status filter."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get(self, request, *args, **kwargs):
        qs = ContactSubmission.objects.all()
        status_param = request.query_params.get('status')
        if status_param in ['new', 'in_progress', 'resolved']:
            qs = qs.filter(status=status_param)
        serializer = AdminContactSubmissionSerializer(qs, many=True)
        return Response(serializer.data)


class AdminContactSubmissionUpdateView(views.APIView):
    """Admin: update status / add reply to a contact submission."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def patch(self, request, pk, *args, **kwargs):
        try:
            submission = ContactSubmission.objects.get(pk=pk)
        except ContactSubmission.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminContactSubmissionSerializer(submission, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── ADMIN DASHBOARD STATS ────────────────────────────────────────────────────

class AdminDashboardStatsView(views.APIView):
    """Admin: aggregated platform statistics for the dashboard overview."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get(self, request, *args, **kwargs):
        from django.db.models import Sum

        total_students = User.objects.filter(role='student').count()
        total_hrs = User.objects.filter(role='hr').count()
        total_bookings = Booking.objects.count()
        confirmed_bookings = Booking.objects.filter(booking_status='confirmed').count()
        completed_bookings = Booking.objects.filter(booking_status='completed').count()
        pending_verifications = HRVerification.objects.filter(verification_status='pending').count()
        approved_hrs = HRVerification.objects.filter(verification_status='approved').count()
        rejected_hrs = HRVerification.objects.filter(verification_status='rejected').count()

        total_revenue_data = Payment.objects.filter(payment_status='success').aggregate(
            total=Sum('amount')
        )
        total_revenue = float(total_revenue_data['total'] or 0)

        new_contacts = ContactSubmission.objects.filter(status='new').count()
        total_contacts = ContactSubmission.objects.count()

        # Recent signups (last 5)
        recent_students = list(User.objects.filter(role='student').order_by('-created_at')[:5].values(
            'id', 'full_name', 'email', 'created_at'
        ))
        recent_hrs = list(User.objects.filter(role='hr').order_by('-created_at')[:5].values(
            'id', 'full_name', 'email', 'created_at'
        ))
        recent_bookings = []
        for b in Booking.objects.select_related('student', 'hr', 'slot').order_by('-booked_at')[:5]:
            recent_bookings.append({
                'id': b.id,
                'student': b.student.full_name,
                'hr': b.hr.full_name,
                'date': str(b.slot.date),
                'status': b.booking_status,
                'booked_at': b.booked_at,
            })

        return Response({
            'total_students': total_students,
            'total_hrs': total_hrs,
            'total_bookings': total_bookings,
            'confirmed_bookings': confirmed_bookings,
            'completed_bookings': completed_bookings,
            'pending_verifications': pending_verifications,
            'approved_hrs': approved_hrs,
            'rejected_hrs': rejected_hrs,
            'total_revenue': total_revenue,
            'new_contacts': new_contacts,
            'total_contacts': total_contacts,
            'recent_students': recent_students,
            'recent_hrs': recent_hrs,
            'recent_bookings': recent_bookings,
        })


class AdminBookingListView(generics.ListAPIView):
    """Admin: view all bookings across the platform."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]
    serializer_class = BookingSerializer

    def get_queryset(self):
        qs = Booking.objects.select_related('student', 'hr', 'slot').order_by('-booked_at')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(booking_status=status_param)
        return qs
