import tempfile
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
# pyrefly: ignore [missing-import]
from rest_framework.test import APITestCase
from rest_framework import status
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import (
    StudentProfile, HRProfile, HRVerification, InterviewSlot, Booking, Payment, Meeting, Review,
    ResumeAnalysis, InterviewAnalysis, SkillGapReport, CareerGuidance, LearningRoadmap,
    HRAssessment, Wallet, WalletTransaction
)
from users.services import calculate_student_completion_percentage
from core.validators import validate_student_resume, validate_hr_profile_photo

User = get_user_model()

class MockInterviewAuthTests(APITestCase):
    def setUp(self):
        # Create user fixtures
        self.student_user = User.objects.create_user(
            email="student@mock.com",
            password="password123",
            full_name="Alice Student",
            phone_number="1234567890",
            role="student"
        )
        self.hr_user = User.objects.create_user(
            email="hr@mock.com",
            password="password123",
            full_name="Bob HR",
            phone_number="0987654321",
            role="hr"
        )
        self.admin_user = User.objects.create_superuser(
            email="admin@mock.com",
            password="password123",
            full_name="System Admin",
            phone_number="1122334455"
        )

    def test_student_registration(self):
        url = reverse('register_student')
        data = {
            "email": "new_student@mock.com",
            "password": "passwordsignup",
            "full_name": "New Candidate",
            "phone_number": "5556667777"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="new_student@mock.com").exists())
        user = User.objects.get(email="new_student@mock.com")
        self.assertEqual(user.role, 'student')
        self.assertTrue(StudentProfile.objects.filter(user=user).exists())

    def test_hr_registration(self):
        url = reverse('register_hr')
        data = {
            "email": "new_hr@mock.com",
            "password": "passwordsignup",
            "full_name": "New Recruiter",
            "phone_number": "7778889999"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="new_hr@mock.com").exists())
        user = User.objects.get(email="new_hr@mock.com")
        self.assertEqual(user.role, 'hr')
        self.assertTrue(HRProfile.objects.filter(user=user).exists())
        self.assertTrue(HRVerification.objects.filter(hr=user).exists())

    def test_jwt_login_custom_payload(self):
        url = reverse('login')
        data = {
            "email": "student@mock.com",
            "password": "password123"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'student@mock.com')
        self.assertEqual(response.data['user']['role'], 'student')


class ProfileCompletionServiceTests(APITestCase):
    def test_completeness_calculation(self):
        user = User.objects.create_user(
            email="test_student@mock.com",
            password="password123",
            full_name="Test Student",
            role="student"
        )
        profile = StudentProfile.objects.create(user=user)
        
        # Initial score is 0
        calculate_student_completion_percentage(profile)
        self.assertEqual(profile.profile_completion, 0)

        # Fill Academic details (+30%)
        profile.college_name = "COEP"
        profile.degree = "B.E."
        profile.branch = "IT"
        profile.graduation_year = 2026
        calculate_student_completion_percentage(profile)
        self.assertEqual(profile.profile_completion, 30)

        # Add Skills (+20%)
        profile.skills = ["Python", "Django"]
        calculate_student_completion_percentage(profile)
        self.assertEqual(profile.profile_completion, 50)

        # Add Career Goals (+20%)
        profile.career_goal = "Backend Engineer"
        calculate_student_completion_percentage(profile)
        self.assertEqual(profile.profile_completion, 70)

        # Upload Dummy Resume (+30%)
        profile.resume = SimpleUploadedFile("resume.pdf", b"pdf content", content_type="application/pdf")
        calculate_student_completion_percentage(profile)
        self.assertEqual(profile.profile_completion, 100)


class FileValidationTests(APITestCase):
    def test_invalid_resume_extension(self):
        invalid_file = SimpleUploadedFile("resume.txt", b"plain text", content_type="text/plain")
        with self.assertRaises(ValidationError):
            validate_student_resume(invalid_file)

    def test_oversized_profile_photo(self):
        # 3MB file (Limit is 2MB)
        large_file = SimpleUploadedFile("photo.png", b"0" * (3 * 1024 * 1024), content_type="image/png")
        with self.assertRaises(ValidationError):
            validate_hr_profile_photo(large_file)

    def test_valid_pdf_resume(self):
        valid_file = SimpleUploadedFile("resume.pdf", b"pdf bytes", content_type="application/pdf")
        # Should not raise validation error
        try:
            validate_student_resume(valid_file)
        except ValidationError:
            self.fail("ValidationError raised unexpectedly on a valid PDF resume file.")


class RoleBasedPermissionTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(email="student@mock.com", password="password", full_name="Student", role="student")
        self.hr = User.objects.create_user(email="hr@mock.com", password="password", full_name="HR", role="hr")
        self.admin = User.objects.create_superuser(email="admin@mock.com", password="password", full_name="Admin")
        
        # Setup tokens
        self.student_token = str(RefreshToken.for_user(self.student).access_token)
        self.hr_token = str(RefreshToken.for_user(self.hr).access_token)

    def test_student_cannot_access_admin_endpoints(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        url = reverse('admin_users')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_hr_cannot_access_admin_endpoints(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.hr_token}')
        url = reverse('admin_users')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_access_hr_endpoints(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        url = reverse('hr_profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class Phase2BookingAndPaymentTests(APITestCase):
    def setUp(self):
        # Create student and HR
        self.student = User.objects.create_user(email="student@mock.com", password="password", full_name="Student User", role="student")
        self.hr = User.objects.create_user(email="hr@mock.com", password="password", full_name="HR User", role="hr")
        
        # Ensure student profile is created
        self.student_profile, _ = StudentProfile.objects.get_or_create(user=self.student)
        
        # Ensure HR profile & verification is created
        self.hr_profile, _ = HRProfile.objects.get_or_create(user=self.hr)
        self.hr_verification, _ = HRVerification.objects.get_or_create(hr=self.hr)
        
        # Setup tokens
        self.student_token = str(RefreshToken.for_user(self.student).access_token)
        self.hr_token = str(RefreshToken.for_user(self.hr).access_token)

    def test_hr_can_create_slot_only_if_verified(self):
        # 1. Reject or pending HR tries to create slot
        self.hr_verification.verification_status = 'pending'
        self.hr_verification.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.hr_token}')
        url = reverse('hr_slots')
        data = {
            "date": "2026-12-01",
            "start_time": "10:00:00",
            "end_time": "10:30:00",
            "duration": 30,
            "price": "299.00"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # 2. Approved HR tries to create slot
        self.hr_verification.verification_status = 'approved'
        self.hr_verification.save()
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(InterviewSlot.objects.count(), 1)

    def test_student_cannot_book_below_70_completeness(self):
        # Approve HR and create slot
        self.hr_verification.verification_status = 'approved'
        self.hr_verification.save()
        slot = InterviewSlot.objects.create(hr=self.hr, date="2026-12-01", start_time="10:00:00", end_time="10:30:00", duration=30, price=299.00, status="available")
        
        # Set student completeness < 70%
        self.student_profile.profile_completion = 50
        self.student_profile.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        url = reverse('student_bookings_create')
        data = {"slot_id": slot.id}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("threshold", response.data['detail'])

    def test_student_can_book_at_70_completeness_and_prevent_double_booking(self):
        # Approve HR and create slot
        self.hr_verification.verification_status = 'approved'
        self.hr_verification.save()
        slot = InterviewSlot.objects.create(hr=self.hr, date="2026-12-01", start_time="10:00:00", end_time="10:30:00", duration=30, price=299.00, status="available")
        
        # Set student completeness >= 70%
        self.student_profile.profile_completion = 70
        self.student_profile.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        url = reverse('student_bookings_create')
        data = {"slot_id": slot.id}
        
        # 1. First booking succeeds
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        booking = Booking.objects.get(pk=response.data['id'])
        self.assertEqual(booking.booking_status, 'pending')
        
        # Slot is now locked
        slot.refresh_from_db()
        self.assertEqual(slot.status, 'booked')
        
        # 2. Second student tries to book same slot -> fails
        another_student = User.objects.create_user(email="another@mock.com", password="password", full_name="Another Student", role="student")
        another_profile, _ = StudentProfile.objects.get_or_create(user=another_student)
        another_profile.profile_completion = 80
        another_profile.save()
        
        another_token = str(RefreshToken.for_user(another_student).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {another_token}')
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payment_verification_success_generates_meeting(self):
        self.hr_verification.verification_status = 'approved'
        self.hr_verification.save()
        slot = InterviewSlot.objects.create(hr=self.hr, date="2026-12-01", start_time="10:00:00", end_time="10:30:00", duration=30, price=299.00, status="available")
        
        self.student_profile.profile_completion = 70
        self.student_profile.save()
        
        # Create booking & payment
        booking = Booking.objects.create(student=self.student, hr=self.hr, slot=slot, booking_status="pending", payment_status="pending")
        payment = Payment.objects.create(booking=booking, razorpay_order_id="order_mock_xyz123", amount=299.00, currency="INR", payment_status="pending")
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        url = reverse('payment_verify')
        data = {
            "razorpay_order_id": "order_mock_xyz123",
            "razorpay_payment_id": "pay_mock_999",
            "razorpay_signature": "mock_signature"
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify status transitions
        booking.refresh_from_db()
        payment.refresh_from_db()
        slot.refresh_from_db()
        
        self.assertEqual(booking.booking_status, 'confirmed')
        self.assertEqual(booking.payment_status, 'success')
        self.assertEqual(payment.payment_status, 'success')
        self.assertEqual(slot.status, 'booked')
        
        # Check meeting generation
        self.assertTrue(Meeting.objects.filter(booking=booking).exists())
        meeting = Meeting.objects.get(booking=booking)
        self.assertIn("meet.google.com", meeting.meeting_link)


class Phase3AITests(APITestCase):
    def setUp(self):
        # Create student and HR
        self.student = User.objects.create_user(email="student@mock.com", password="password", full_name="Student User", role="student")
        self.hr = User.objects.create_user(email="hr@mock.com", password="password", full_name="HR User", role="hr")
        
        # Ensure profiles are set
        self.student_profile, _ = StudentProfile.objects.get_or_create(user=self.student)
        self.hr_profile, _ = HRProfile.objects.get_or_create(user=self.hr)
        
        # Setup tokens
        self.student_token = str(RefreshToken.for_user(self.student).access_token)
        self.hr_token = str(RefreshToken.for_user(self.hr).access_token)

    def test_resume_analysis_requires_uploaded_resume(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        url = reverse('resume_analysis')
        
        # Currently no resume is uploaded
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("uploaded", response.data['detail'])

    def test_resume_analysis_generation_success(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        url = reverse('resume_analysis')
        
        # Simulate upload
        self.student_profile.resume = SimpleUploadedFile("cv.pdf", b"pdf content text", content_type="application/pdf")
        self.student_profile.save()
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("resume_score", response.data)
        self.assertEqual(ResumeAnalysis.objects.filter(student=self.student).count(), 1)

    def test_interview_report_access_and_generation(self):
        slot = InterviewSlot.objects.create(hr=self.hr, date="2026-12-01", start_time="10:00:00", end_time="10:30:00", duration=30, price=299.00, status="booked")
        booking = Booking.objects.create(student=self.student, hr=self.hr, slot=slot, booking_status="completed")
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        url = reverse('interview_report_detail', kwargs={"booking_id": booking.id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("technical_score", response.data)
        self.assertTrue(InterviewAnalysis.objects.filter(booking=booking).exists())

    def test_skill_gap_and_roadmap_generation(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        url = reverse('skill_gap_analysis')
        data = {"target_role": "java backend developer"}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("readiness_score", response.data)
        self.assertEqual(SkillGapReport.objects.filter(student=self.student).count(), 1)
        self.assertEqual(LearningRoadmap.objects.filter(student=self.student).count(), 1)

    def test_career_coach_response(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        url = reverse('ai_coach')
        data = {
            "message": "How do I prepare for technical interviews?",
            "history": []
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("reply", response.data)

    def test_student_analytics_aggregation(self):
        slot = InterviewSlot.objects.create(hr=self.hr, date="2026-12-01", start_time="10:00:00", end_time="10:30:00", duration=30, price=299.00, status="booked")
        booking = Booking.objects.create(student=self.student, hr=self.hr, slot=slot, booking_status="completed")
        InterviewAnalysis.objects.create(booking=booking, technical_score=90, communication_score=80, behavioral_score=85)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        url = reverse('student_analytics')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['interviews_completed'], 1)
        self.assertEqual(response.data['technical_average'], 90)
        self.assertEqual(response.data['communication_average'], 80)


class Phase2And3ExtensionsTests(APITestCase):
    def setUp(self):
        # Create users
        self.student = User.objects.create_user(
            email="student_ext@mock.com",
            password="password123",
            full_name="Student Ext",
            role="student"
        )
        self.hr = User.objects.create_user(
            email="hr_ext@mock.com",
            password="password123",
            full_name="HR Ext",
            role="hr"
        )
        
        # Profiles
        self.student_profile, _ = StudentProfile.objects.get_or_create(user=self.student)
        self.hr_profile, _ = HRProfile.objects.get_or_create(
            user=self.hr,
            defaults={
                "ticked_skills": ["Python", "Django", "Aptitude"],
                "years_of_experience": 5,
                "company_name": "Test Company",
                "designation": "Tech Lead"
            }
        )
        self.hr_verification, _ = HRVerification.objects.get_or_create(hr=self.hr)

        # Tokens
        self.student_token = str(RefreshToken.for_user(self.student).access_token)
        self.hr_token = str(RefreshToken.for_user(self.hr).access_token)

    def test_mock_otp_flow(self):
        # 1. Send OTP
        url = reverse('otp_send')
        response = self.client.post(url, {"email": "student_ext@mock.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['mock_otp'], '123456')

        # 2. Verify OTP - Correct
        url_verify = reverse('otp_verify')
        response = self.client.post(url_verify, {"email": "student_ext@mock.com", "otp": "123456"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')

        # 3. Verify OTP - Incorrect
        response = self.client.post(url_verify, {"email": "student_ext@mock.com", "otp": "wrong"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_hr_assessment_flow(self):
        # 1. Generate Assessment
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.hr_token}')
        url_gen = reverse('hr_assessment_generate')
        response = self.client.post(url_gen)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('questions', response.data)
        self.assertEqual(len(response.data['questions']), 5)

        # Check DB entry exists
        assessment = HRAssessment.objects.get(hr=self.hr)
        self.assertEqual(len(assessment.questions), 5)

        # 2. Submit Assessment
        url_submit = reverse('hr_assessment_submit')
        answers = ["Python standard classes", "Django ORM query optimization", "Linear binary search", "Mock answer 4", "Mock answer 5"]
        response = self.client.post(url_submit, {"answers": answers}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['score'] > 0)
        self.assertIn('feedback', response.data)

        # Check update in DB
        assessment.refresh_from_db()
        self.assertEqual(assessment.answers, answers)
        self.assertTrue(assessment.score > 0)

    def test_wallet_deposit_withdraw_checkout(self):
        # 1. Check initial balance
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        url_wallet = reverse('wallet_details')
        response = self.client.get(url_wallet)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['balance']), 0.0)

        # 2. Deposit funds
        url_dep = reverse('wallet_deposit')
        response = self.client.post(url_dep, {"amount": "1000.00"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['balance']), 1000.0)
        self.assertEqual(WalletTransaction.objects.filter(wallet__user=self.student, transaction_type='deposit').count(), 1)

        # 3. Withdraw funds (HR Professional)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.hr_token}')
        url_with = reverse('wallet_withdraw')
        
        # Withdraw with 0 balance -> failure
        response = self.client.post(url_with, {"amount": "500.00"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Deposit to HR wallet first, then withdraw
        hr_wallet, _ = Wallet.objects.get_or_create(user=self.hr)
        hr_wallet.balance = Decimal('800.00')
        hr_wallet.save()

        response = self.client.post(url_with, {"amount": "300.00"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['balance']), 500.00)
        self.assertEqual(WalletTransaction.objects.filter(wallet=hr_wallet, transaction_type='withdrawal').count(), 1)

        # 4. Booking Checkout via Wallet
        # Make HR verified so we can create a slot
        self.hr_verification.verification_status = 'approved'
        self.hr_verification.save()

        # Case A: Another student with 0 balance tries to checkout → should fail (400)
        slot_a = InterviewSlot.objects.create(
            hr=self.hr,
            date="2026-12-09",
            start_time="09:00:00",
            end_time="09:30:00",
            duration=30,
            price=250.00,
            status="available"
        )
        another_student = User.objects.create_user(email="no_cash@mock.com", password="password", full_name="Poor Student", role="student")
        another_token = str(RefreshToken.for_user(another_student).access_token)
        booking_a = Booking.objects.create(student=another_student, hr=self.hr, slot=slot_a, booking_status="pending")
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {another_token}')
        url_checkout = reverse('booking_wallet_checkout')
        response = self.client.post(url_checkout, {"booking_id": booking_a.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Case B: Student with 1000.00 balance checks out their own booking → should pass (200)
        slot_b = InterviewSlot.objects.create(
            hr=self.hr,
            date="2026-12-10",
            start_time="11:00:00",
            end_time="11:30:00",
            duration=30,
            price=250.00,
            status="available"
        )
        booking_b = Booking.objects.create(
            student=self.student,
            hr=self.hr,
            slot=slot_b,
            booking_status="pending",
            payment_status="pending"
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        response = self.client.post(url_checkout, {"booking_id": booking_b.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify state transitions
        booking_b.refresh_from_db()
        slot_b.refresh_from_db()
        self.assertEqual(booking_b.booking_status, 'confirmed')
        self.assertEqual(booking_b.payment_status, 'success')
        self.assertEqual(slot_b.status, 'booked')

        # Check balance after deduction: 1000.00 - 250.00 = 750.00
        student_wallet = Wallet.objects.get(user=self.student)
        self.assertEqual(float(student_wallet.balance), 750.0)

    def test_multi_criteria_reviews_and_leaderboard(self):
        # Create a confirmed booking to complete with feedback
        slot = InterviewSlot.objects.create(
            hr=self.hr,
            date="2026-12-15",
            start_time="10:00:00",
            end_time="10:30:00",
            duration=30,
            price=300.00,
            status="booked"
        )
        booking = Booking.objects.create(
            student=self.student,
            hr=self.hr,
            slot=slot,
            booking_status="confirmed"
        )

        # Submit HR feedback for student
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.hr_token}')
        url_feedback = reverse('session_feedback', kwargs={"pk": booking.id})
        data = {
            "rating": 4,
            "comment": "Good preparation, needs work on communication."
        }
        response = self.client.post(url_feedback, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Check booking is marked completed
        booking.refresh_from_db()
        self.assertEqual(booking.booking_status, 'completed')

        # Check review was created
        self.assertEqual(Review.objects.filter(booking=booking).count(), 1)
        review = Review.objects.get(booking=booking)
        self.assertEqual(review.rating, 4)

        # Now test leaderboard endpoint
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.student_token}')
        url_lead = reverse('leaderboard')
        response = self.client.get(url_lead)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('top_rated', response.data)
        self.assertIn('most_booked', response.data)
        
        # Verify the structure has our HR Ext professional
        hr_entry = [entry for entry in response.data['top_rated'] if entry['hr_id'] == self.hr.id]
        self.assertTrue(len(hr_entry) > 0)
        self.assertEqual(hr_entry[0]['avg_rating'], 4.0)
        self.assertEqual(hr_entry[0]['booking_count'], 1)

