from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import MentorProfile
from .serializers import MentorProfileSerializer


class IsMentorOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class MentorListView(generics.ListAPIView):
    serializer_class = MentorProfileSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'bio', 'tags__name']
    filterset_fields = ['is_verified']
    ordering_fields = ['avg_rating', 'years_experience', 'created_at']
    ordering = ['-avg_rating']

    def get_queryset(self):
        queryset = MentorProfile.objects.select_related('user').prefetch_related('tags').filter(is_verified=True)
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__name__icontains=tag)
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(avg_rating__gte=float(min_rating))
        return queryset


class MentorCreateView(generics.CreateAPIView):
    serializer_class = MentorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MentorDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MentorProfileSerializer
    permission_classes = [IsMentorOwner]
    queryset = MentorProfile.objects.select_related('user').prefetch_related('tags')


class MyMentorProfileView(APIView):
    """Giriş yapmış mentorun kendi profilini GET/PATCH etmesi için."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.mentor_profile
        except MentorProfile.DoesNotExist:
            return Response({'detail': 'Mentor profili bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MentorProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        try:
            profile = request.user.mentor_profile
        except MentorProfile.DoesNotExist:
            return Response({'detail': 'Mentor profili bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MentorProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
