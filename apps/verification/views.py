from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Verification
from .serializers import VerificationSerializer, VerificationReviewSerializer


class VerificationApplyView(generics.CreateAPIView):
    serializer_class = VerificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        mentor_profile = self.request.user.mentor_profile
        serializer.save(mentor=mentor_profile)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class VerificationListView(generics.ListAPIView):
    serializer_class = VerificationSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Verification.objects.select_related('mentor__user').order_by('-applied_at')


class VerificationReviewView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        try:
            verification = Verification.objects.get(pk=pk)
        except Verification.DoesNotExist:
            return Response({'detail': 'Bulunamadi.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = VerificationReviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        action = serializer.validated_data['action']
        admin_note = serializer.validated_data.get('admin_note', '')
        if action == 'approve':
            verification.approve(admin_note)
        else:
            verification.reject(admin_note)
        return Response(VerificationSerializer(verification).data)
