from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings


class Review(models.Model):
    mentor = models.ForeignKey(
        'mentors.MentorProfile',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='given_reviews'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('mentor', 'student')

    def __str__(self):
        return f'{self.student.username} -> {self.mentor.user.username}: {self.rating}/5'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.mentor.update_avg_rating()

    def delete(self, *args, **kwargs):
        mentor = self.mentor
        super().delete(*args, **kwargs)
        mentor.update_avg_rating()
