from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Review
from .serializers import ReviewSerializer


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Review.objects.select_related('student', 'mentor__user')
        mentor_id = self.request.query_params.get('mentor')
        if mentor_id:
            qs = qs.filter(mentor_id=mentor_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class ReviewDeleteView(generics.DestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(student=self.request.user)


class AdminReviewListView(generics.ListAPIView):
    """Admin: tüm yorumları listele"""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        return Review.objects.select_related('student', 'mentor__user').order_by('-created_at')


class AdminReviewDeleteView(generics.DestroyAPIView):
    """Admin: herhangi bir yorumu sil"""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Review.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({'detail': 'Yorum silindi.'}, status=status.HTTP_200_OK)
