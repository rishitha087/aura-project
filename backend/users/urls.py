from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    StudentRegisterView,
    HRRegisterView,
    CurrentUserView,
    StudentProfileDetailView,
    StudentResumeUploadView,
    HRProfileDetailView,
    HRProfilePhotoUploadView,
    HRVerificationUploadView,
    AdminUserListView,
    AdminHRVerificationListView,
    AdminHRVerificationApproveRejectView,
    
    # Phase 2 views
    HRSlotListCreateView,
    HRSlotDestroyView,
    StudentHRDiscoveryListView,
    StudentHRDetailView,
    StudentBookingCreateView,
    PaymentCreateOrderView,
    PaymentVerifySignatureView,
    StudentInterviewsListView,
    HRInterviewsListView,
    SessionDetailsView,
    SessionFeedbackSubmitView,
    
    # Phase 3 views
    ResumeAnalysisView,
    InterviewReportDetailView,
    SkillGapAnalysisView,
    CareerGuidanceView,
    RecommendedHRsView,
    LearningRoadmapView,
    AICoachChatView,
    StudentAnalyticsView,
    HRAnalyticsView,
    
    # Extension views
    OTPSendView,
    OTPVerifyView,
    HRAssessmentGenerateView,
    HRAssessmentSubmitView,
    WalletDetailsView,
    WalletDepositView,
    WalletWithdrawView,
    BookingWalletCheckoutView,
    LeaderboardView,

    # New: Contact & Admin Stats
    ContactSubmissionCreateView,
    AdminContactSubmissionListView,
    AdminContactSubmissionUpdateView,
    AdminDashboardStatsView,
    AdminBookingListView,
)

urlpatterns = [
    # Auth
    path('auth/register/student/', StudentRegisterView.as_view(), name='register_student'),
    path('auth/register/hr/', HRRegisterView.as_view(), name='register_hr'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),

    # Student Profile
    path('student/profile/', StudentProfileDetailView.as_view(), name='student_profile'),
    path('student/profile/resume/', StudentResumeUploadView.as_view(), name='student_resume'),

    # HR Profile
    path('hr/profile/', HRProfileDetailView.as_view(), name='hr_profile'),
    path('hr/profile/photo/', HRProfilePhotoUploadView.as_view(), name='hr_photo'),
    path('hr/profile/documents/', HRVerificationUploadView.as_view(), name='hr_verification'),

    # Admin
    path('admin/users/', AdminUserListView.as_view(), name='admin_users'),
    path('admin/verifications/', AdminHRVerificationListView.as_view(), name='admin_verifications'),
    path('admin/verifications/<int:pk>/verify/', AdminHRVerificationApproveRejectView.as_view(), name='admin_verify_hr'),
    path('admin/stats/', AdminDashboardStatsView.as_view(), name='admin_stats'),
    path('admin/bookings/', AdminBookingListView.as_view(), name='admin_bookings'),
    path('admin/contact/', AdminContactSubmissionListView.as_view(), name='admin_contact_list'),
    path('admin/contact/<int:pk>/', AdminContactSubmissionUpdateView.as_view(), name='admin_contact_update'),

    # Contact (public)
    path('contact/', ContactSubmissionCreateView.as_view(), name='contact_submit'),

    # --- PHASE 2 PATHS ---
    
    # Slot availability
    path('hr/slots/', HRSlotListCreateView.as_view(), name='hr_slots'),
    path('hr/slots/<int:pk>/', HRSlotDestroyView.as_view(), name='hr_slot_destroy'),

    # Discovery
    path('student/hrs/', StudentHRDiscoveryListView.as_view(), name='student_hrs'),
    path('student/hrs/<int:pk>/', StudentHRDetailView.as_view(), name='student_hr_detail'),

    # Bookings & Payments
    path('bookings/', StudentBookingCreateView.as_view(), name='student_bookings_create'),
    path('payments/order/', PaymentCreateOrderView.as_view(), name='payment_order'),
    path('payments/verify/', PaymentVerifySignatureView.as_view(), name='payment_verify'),

    # Interviews tab list
    path('student/interviews/', StudentInterviewsListView.as_view(), name='student_interviews'),
    path('hr/interviews/', HRInterviewsListView.as_view(), name='hr_interviews'),

    # Session Management
    path('session/<int:pk>/', SessionDetailsView.as_view(), name='session_details'),
    path('session/<int:pk>/feedback/', SessionFeedbackSubmitView.as_view(), name='session_feedback'),

    # --- PHASE 3 PATHS ---
    path('student/resume-analysis/', ResumeAnalysisView.as_view(), name='resume_analysis'),
    path('student/interview-report/<int:booking_id>/', InterviewReportDetailView.as_view(), name='interview_report_detail'),
    path('student/skill-gap/', SkillGapAnalysisView.as_view(), name='skill_gap_analysis'),
    path('student/career-guidance/', CareerGuidanceView.as_view(), name='career_guidance'),
    path('student/recommended-hrs/', RecommendedHRsView.as_view(), name='recommended_hrs'),
    path('student/roadmap/', LearningRoadmapView.as_view(), name='learning_roadmap'),
    path('student/ai-coach/', AICoachChatView.as_view(), name='ai_coach'),
    
    # Analytics
    path('student/analytics/', StudentAnalyticsView.as_view(), name='student_analytics'),
    path('hr/analytics/', HRAnalyticsView.as_view(), name='hr_analytics'),

    # --- EXTENSIONS PATHS ---
    path('auth/otp/send/', OTPSendView.as_view(), name='otp_send'),
    path('auth/otp/verify/', OTPVerifyView.as_view(), name='otp_verify'),
    path('hr/assessment/generate/', HRAssessmentGenerateView.as_view(), name='hr_assessment_generate'),
    path('hr/assessment/submit/', HRAssessmentSubmitView.as_view(), name='hr_assessment_submit'),
    path('wallet/', WalletDetailsView.as_view(), name='wallet_details'),
    path('wallet/deposit/', WalletDepositView.as_view(), name='wallet_deposit'),
    path('wallet/withdraw/', WalletWithdrawView.as_view(), name='wallet_withdraw'),
    path('bookings/wallet-checkout/', BookingWalletCheckoutView.as_view(), name='booking_wallet_checkout'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
]
