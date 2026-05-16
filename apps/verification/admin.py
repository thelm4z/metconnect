from django.contrib import admin
from .models import Verification

@admin.register(Verification)
class VerificationAdmin(admin.ModelAdmin):
    list_display = ['mentor', 'status', 'applied_at', 'reviewed_at']
    list_filter = ['status']
