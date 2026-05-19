from django.db import models


class Verification(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Beklemede'),
        ('approved', 'Onaylandi'),
        ('rejected', 'Reddedildi'),
    ]
    mentor = models.OneToOneField(
        'mentors.MentorProfile',
        on_delete=models.CASCADE,
        related_name='verification'
    )
    cv_file = models.FileField(upload_to='verifications/cv/')
    extra_note = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    admin_note = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.mentor.user.username} - {self.status}'

    def approve(self, admin_note=''):
        from django.utils import timezone
        self.status = 'approved'
        self.admin_note = admin_note
        self.reviewed_at = timezone.now()
        self.save()
        self.mentor.is_verified = True
        self.mentor.save(update_fields=['is_verified'])
        # Hesabı aktifleştir
        user = self.mentor.user
        user.is_active = True
        user.save(update_fields=['is_active'])

    def reject(self, admin_note=''):
        from django.utils import timezone
        self.status = 'rejected'
        self.admin_note = admin_note
        self.reviewed_at = timezone.now()
        self.save()
        self.mentor.is_verified = False
        self.mentor.save(update_fields=['is_verified'])
        # Hesabı devre dışı bırak → login engellensin
        user = self.mentor.user
        user.is_active = False
        user.save(update_fields=['is_active'])
