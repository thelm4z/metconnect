from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import StudentProfile
from .serializers import StudentProfileSerializer


class MyStudentProfileView(APIView):
    """Giriş yapmış öğrencinin kendi profilini GET/PATCH etmesi için."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.student_profile
        except StudentProfile.DoesNotExist:
            return Response({'detail': 'Öğrenci profili bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = StudentProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        try:
            profile = request.user.student_profile
        except StudentProfile.DoesNotExist:
            return Response({'detail': 'Öğrenci profili bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = StudentProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
