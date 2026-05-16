from django.contrib import admin
from .models import MentorProfile, MentorTag

class MentorTagInline(admin.TabularInline):
    model = MentorTag
    extra = 1

@admin.register(MentorProfile)
class MentorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'years_experience', 'is_verified', 'avg_rating']
    list_filter = ['is_verified']
    inlines = [MentorTagInline]
