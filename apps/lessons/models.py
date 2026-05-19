import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class LessonSession(models.Model):
    STATUS_WAITING = 'waiting'
    STATUS_ACTIVE = 'active'
    STATUS_ENDED = 'ended'
    STATUS_CHOICES = [
        (STATUS_WAITING, 'Bekliyor'),
        (STATUS_ACTIVE, 'Aktif'),
        (STATUS_ENDED, 'Tamamlandı'),
    ]

    LANGUAGE_CHOICES = [
        ('python', 'Python'),
        ('javascript', 'JavaScript'),
        ('java', 'Java'),
        ('cpp', 'C++'),
        ('html', 'HTML/CSS'),
        ('sql', 'SQL'),
        ('typescript', 'TypeScript'),
        ('other', 'Diğer'),
    ]

    title = models.CharField(max_length=200, verbose_name='Başlık')
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='mentor_sessions', verbose_name='Mentor'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='student_sessions', verbose_name='Öğrenci'
    )
    room_code = models.CharField(max_length=12, unique=True, verbose_name='Oda Kodu')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_WAITING)
    shared_notes = models.TextField(blank=True, verbose_name='Paylaşımlı Notlar')
    shared_code = models.TextField(blank=True, verbose_name='Paylaşımlı Kod')
    code_language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default='python')
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Ders Oturumu'
        verbose_name_plural = 'Ders Oturumları'

    def __str__(self):
        return f'{self.title} [{self.room_code}]'

    @classmethod
    def generate_room_code(cls):
        while True:
            code = uuid.uuid4().hex[:8].upper()
            if not cls.objects.filter(room_code=code).exists():
                return code
