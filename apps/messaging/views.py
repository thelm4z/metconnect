from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Message
from .serializers import MessageSerializer

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        other_id = self.request.query_params.get('with')
        qs = Message.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).select_related('sender', 'receiver')
        if other_id:
            qs = qs.filter(
                Q(sender=user, receiver_id=other_id) |
                Q(sender_id=other_id, receiver=user)
            )
        return qs

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

class MessageMarkReadView(generics.UpdateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Message.objects.all()

    def perform_update(self, serializer):
        serializer.save(is_read=True)

class UnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(receiver=request.user, is_read=False).count()
        return Response({'count': count})


class MarkConversationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        sender_id = request.data.get('sender_id')
        if not sender_id:
            return Response({'detail': 'sender_id gerekli.'}, status=400)
        Message.objects.filter(
            receiver=request.user,
            sender_id=sender_id,
            is_read=False
        ).update(is_read=True)
        return Response({'detail': 'Okundu.'})

