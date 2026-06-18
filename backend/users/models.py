from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('hr', 'HR Professional'),
        ('admin', 'Admin'),
    ]

    username = None
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    created_at = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return f"{self.email} ({self.role})"

class StudentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='student_profile')
    college_name = models.CharField(max_length=255, blank=True)
    degree = models.CharField(max_length=100, blank=True)
    branch = models.CharField(max_length=100, blank=True)
    graduation_year = models.IntegerField(null=True, blank=True)
    skills = models.JSONField(default=list, blank=True)
    career_goal = models.CharField(max_length=255, blank=True)
    resume = models.FileField(upload_to='resumes/students/', blank=True, null=True)
    profile_completion = models.IntegerField(default=0)

    def __str__(self):
        return f"Student: {self.user.full_name}"

class HRProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='hr_profile')
    company_name = models.CharField(max_length=255, blank=True)
    designation = models.CharField(max_length=255, blank=True)
    years_of_experience = models.IntegerField(null=True, blank=True)
    bio = models.TextField(blank=True)
    linkedin_url = models.URLField(blank=True)
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    ticked_skills = models.JSONField(default=list, blank=True)
    professional_qualities = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"HR Professional: {self.user.full_name}"

class HRVerification(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    hr = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='hr_verification')
    resume_file = models.FileField(upload_to='resumes/hr/', blank=True, null=True)
    employee_id_file = models.FileField(upload_to='verification_ids/', blank=True, null=True)
    experience_letter = models.FileField(upload_to='experience_letters/', blank=True, null=True)
    pay_slips_file = models.FileField(upload_to='verification_pay_slips/', blank=True, null=True)
    verification_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)

    def __str__(self):
        return f"Verification for {self.hr.full_name} ({self.verification_status})"

# --- PHASE 2 MODELS ---

class InterviewSlot(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('booked', 'Booked'),
        ('cancelled', 'Cancelled'),
    ]
    DURATION_CHOICES = [
        (30, '30 Minutes'),
        (45, '45 Minutes'),
        (60, '60 Minutes'),
    ]

    hr = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration = models.IntegerField(choices=DURATION_CHOICES)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    meeting_link = models.URLField(blank=True, help_text='Provide a Google Meet, Zoom, or Teams link for this session.')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Slot by {self.hr.full_name} on {self.date} @ {self.start_time}"

class Booking(models.Model):
    BOOKING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='student_bookings')
    hr = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='hr_bookings')
    slot = models.OneToOneField(InterviewSlot, on_delete=models.CASCADE, related_name='booking')
    booking_status = models.CharField(max_length=20, choices=BOOKING_STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    booked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking: {self.student.full_name} with {self.hr.full_name} (Status: {self.booking_status})"

class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment')
    razorpay_order_id = models.CharField(max_length=255, blank=True)
    razorpay_payment_id = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')

    def __str__(self):
        return f"Payment for Booking {self.booking.id} (Status: {self.payment_status})"

class Meeting(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='meeting')
    meeting_link = models.URLField()
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Meeting: {self.booking.id} Link: {self.meeting_link}"

class Review(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reviews_given')
    hr = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reviews_received')
    rating = models.IntegerField(choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5')])
    comment = models.TextField(blank=True)
    
    # Multi-criteria ratings for Student evaluation of HR
    knowledge_rating = models.IntegerField(default=5)
    communication_rating = models.IntegerField(default=5)
    professionalism_rating = models.IntegerField(default=5)
    helpfulness_rating = models.IntegerField(default=5)

    # Multi-criteria ratings for HR evaluation of Student
    student_preparation_rating = models.IntegerField(default=5)
    student_communication_rating = models.IntegerField(default=5)
    student_technical_rating = models.IntegerField(default=5)
    student_attitude_rating = models.IntegerField(default=5)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review for Booking {self.booking.id} (Rating: {self.rating})"


# --- PHASE 3 MODELS ---

class ResumeAnalysis(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='resume_analyses')
    resume_score = models.IntegerField()
    strengths = models.JSONField(default=list)
    weaknesses = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resume Analysis: {self.student.full_name} ({self.resume_score}/100)"


class InterviewAnalysis(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='interview_analysis')
    technical_score = models.IntegerField()
    communication_score = models.IntegerField()
    behavioral_score = models.IntegerField()
    strengths = models.JSONField(default=list)
    weaknesses = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Interview Analysis for Booking {self.booking.id}"


class SkillGapReport(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='skill_gaps')
    target_role = models.CharField(max_length=255)
    missing_skills = models.JSONField(default=list)
    readiness_score = models.IntegerField()
    recommended_path = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Skill Gap: {self.student.full_name} for {self.target_role}"


class CareerGuidance(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='career_guidances')
    recommended_roles = models.JSONField(default=list)
    readiness_score = models.IntegerField()
    improvement_areas = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Career Guidance: {self.student.full_name}"


class LearningRoadmap(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='roadmaps')
    target_role = models.CharField(max_length=255)
    roadmap_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Roadmap: {self.student.full_name} for {self.target_role}"


class HRAssessment(models.Model):
    hr = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='assessment')
    questions = models.JSONField(default=list)
    answers = models.JSONField(default=list)
    score = models.IntegerField(default=0)
    feedback = models.TextField(blank=True)
    is_passed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Assessment for HR: {self.hr.full_name} (Score: {self.score}, Passed: {self.is_passed})"


class Wallet(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    promo_credits = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Wallet for {self.user.email} (Balance: {self.balance})"


class WalletTransaction(models.Model):
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=50) # deposit, withdrawal, payment_received, payment_sent, refund
    status = models.CharField(max_length=20, default='success') # pending, success, failed
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transaction {self.id}: {self.transaction_type} of {self.amount} ({self.status})"


class ContactSubmission(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=500, blank=True)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    admin_reply = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Contact from {self.name} ({self.email}) — {self.status}"

    class Meta:
        ordering = ['-created_at']
