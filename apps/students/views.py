from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import StudentProfile
from .serializers import StudentProfileSerializer


class MyStudentProfileView(APIView):
    """Giriş yapmış öğrencinin kendi profilini GET/PATCH etmesi için."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        serializer = StudentProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        serializer = StudentProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
