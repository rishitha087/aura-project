from django.contrib import admin
from .models import (
    CustomUser, StudentProfile, HRProfile, HRVerification, 
    InterviewSlot, Booking, Payment, Meeting, Review,
    ResumeAnalysis, InterviewAnalysis, SkillGapReport, CareerGuidance, LearningRoadmap,
    HRAssessment, Wallet, WalletTransaction
)

class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'phone_number', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'full_name')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('full_name', 'phone_number', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(StudentProfile)
admin.site.register(HRProfile)
admin.site.register(HRVerification)

# Phase 2 Models
admin.site.register(InterviewSlot)
admin.site.register(Booking)
admin.site.register(Payment)
admin.site.register(Meeting)
admin.site.register(Review)

# Phase 3 Models
admin.site.register(ResumeAnalysis)
admin.site.register(InterviewAnalysis)
admin.site.register(SkillGapReport)
admin.site.register(CareerGuidance)
admin.site.register(LearningRoadmap)
admin.site.register(HRAssessment)
admin.site.register(Wallet)
admin.site.register(WalletTransaction)
