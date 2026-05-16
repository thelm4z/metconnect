import random
import string
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = [
        ('mentor', 'Mentor'),
        ('student', 'Öğrenci'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    is_email_verified = models.BooleanField(default=True)  # True for existing users; set False on new registrations

    def __str__(self):
        return f"{self.username} ({self.role})"

    def is_mentor(self):
        return self.role == 'mentor'

    def is_student(self):
        return self.role == 'student'


class EmailVerificationCode(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='email_verification'
    )
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(default=timezone.now)

    def is_valid(self):
        return (timezone.now() - self.created_at).total_seconds() < 600  # 10 dakika

    @classmethod
    def generate_for_user(cls, user):
        code = ''.join(random.choices(string.digits, k=6))
        cls.objects.filter(user=user).delete()
        return cls.objects.create(user=user, code=code)

    def __str__(self):
        return f"{self.user.username} - {self.code}"


class SiteSettings(models.Model):
    site_title = models.CharField(max_length=100, default='Mentonnect')
    site_description = models.TextField(default="Türkiye'nin önde gelen mentorluk platformu")
    contact_email = models.EmailField(default='', blank=True)
    registration_open = models.BooleanField(default=True)
    maintenance_mode = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Site Ayarları'

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return 'Site Ayarları'
