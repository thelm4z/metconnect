from django.contrib import admin
from .models import StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'user_email', 'interests_preview', 'created_at']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'interests']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    list_per_page = 25

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'E-posta'

    def interests_preview(self, obj):
        if hasattr(obj, 'interests') and obj.interests:
            return obj.interests[:60] + ('...' if len(obj.interests) > 60 else '')
        return '—'
    interests_preview.short_description = 'İlgi Alanları'
