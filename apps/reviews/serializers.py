from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    mentor_name = serializers.CharField(source='mentor.user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'mentor', 'student', 'student_username', 'mentor_name',
                  'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'student', 'created_at']

    def validate(self, attrs):
        request = self.context['request']
        mentor = attrs.get('mentor')
        if Review.objects.filter(mentor=mentor, student=request.user).exists():
            raise serializers.ValidationError('Bu mentörü zaten puanladınız.')
        return attrs
