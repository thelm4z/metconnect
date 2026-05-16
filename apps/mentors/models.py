from django.db import models
from django.conf import settings
from django.db.models import Avg


class MentorProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mentor_profile'
    )
    bio = models.TextField(blank=True)
    years_experience = models.PositiveIntegerField(default=0)
    linkedin_url = models.URLField(blank=True)
    is_verified = models.BooleanField(default=False)
    avg_rating = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Mentor: {self.user.username}'

    def update_avg_rating(self):
        from apps.reviews.models import Review
        result = Review.objects.filter(mentor=self).aggregate(Avg('rating'))
        self.avg_rating = result['rating__avg'] or 0.0
        self.save(update_fields=['avg_rating'])


class MentorTag(models.Model):
    mentor = models.ForeignKey(
        MentorProfile,
        on_delete=models.CASCADE,
        related_name='tags'
    )
    name = models.CharField(max_length=50)

    class Meta:
        unique_together = ('mentor', 'name')

    def __str__(self):
        return self.name
