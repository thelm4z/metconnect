from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_username', 'receiver', 'receiver_username',
                  'content', 'is_read', 'sent_at']
        read_only_fields = ['id', 'sender', 'is_read', 'sent_at']

    def validate_content(self, value):
        from mentonnect.validators import validate_safe_text
        if not value or not value.strip():
            raise serializers.ValidationError('Mesaj içeriği boş olamaz.')
        return validate_safe_text(value.strip(), max_length=2000, field_name='Mesaj')

    def validate(self, attrs):
        request = self.context.get('request')
        if request and attrs.get('receiver') == request.user:
            raise serializers.ValidationError('Kendinize mesaj gönderemezsiniz.')
        return attrs
