from rest_framework import serializers
from .models import MentorProfile, MentorTag

class MentorTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorTag
        fields = ['id', 'name']

class MentorProfileSerializer(serializers.ModelSerializer):
    tags = MentorTagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True, required=False
    )
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = MentorProfile
        fields = ['id', 'user_id', 'username', 'full_name', 'email', 'bio', 'years_experience',
                  'linkedin_url', 'is_verified', 'avg_rating', 'tags', 'tag_names',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'is_verified', 'avg_rating', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return obj.user.get_full_name()

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        mentor = MentorProfile.objects.create(**validated_data)
        for name in tag_names:
            MentorTag.objects.get_or_create(mentor=mentor, name=name.lower().strip())
        return mentor

    def validate_bio(self, value):
        from mentonnect.validators import validate_safe_text
        return validate_safe_text(value, max_length=2000, field_name='Biyografi')

    def validate_linkedin_url(self, value):
        from mentonnect.validators import validate_url
        return validate_url(value)

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tag_names is not None:
            instance.tags.all().delete()
            for name in tag_names:
                MentorTag.objects.get_or_create(mentor=instance, name=name.lower().strip())
        return instance
