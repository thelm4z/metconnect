from rest_framework import serializers
from .models import Verification


class VerificationSerializer(serializers.ModelSerializer):
    mentor_username = serializers.CharField(source='mentor.user.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Verification
        fields = [
            'id', 'mentor', 'mentor_username', 'cv_file', 'extra_note',
            'status', 'status_display', 'admin_note', 'applied_at', 'reviewed_at',
        ]
        read_only_fields = ['id', 'mentor', 'status', 'admin_note', 'applied_at', 'reviewed_at']


class VerificationReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    admin_note = serializers.CharField(required=False, allow_blank=True)
