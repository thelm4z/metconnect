from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from .models import SiteSettings

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    cv_file = serializers.FileField(write_only=True, required=False)
    extra_note = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password', 'cv_file', 'extra_note']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Bu e-posta adresi zaten kullanılıyor.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('cv_file', None)
        validated_data.pop('extra_note', None)
        user = User(**validated_data)
        user.set_password(password)
        user.is_email_verified = False
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_email_verified', 'is_staff']
        read_only_fields = ['id', 'username', 'role', 'is_email_verified', 'is_staff']


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role',
                  'is_staff', 'is_active', 'is_email_verified', 'date_joined']
        read_only_fields = ['id', 'username', 'email', 'date_joined']


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = ['site_title', 'site_description', 'contact_email',
                  'registration_open', 'maintenance_mode', 'updated_at']
        read_only_fields = ['updated_at']


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Mevcut şifre yanlış.')
        return value

    def validate(self, attrs):
        if attrs.get('new_password') == attrs.get('current_password'):
            raise serializers.ValidationError({'new_password': 'Yeni şifre mevcut şifreyle aynı olamaz.'})
        return attrs

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
