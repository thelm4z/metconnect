from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import LessonSession
from .serializers import LessonSessionSerializer, LessonSessionDetailSerializer


class LessonListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LessonSessionSerializer
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        if user.role == 'mentor':
            return LessonSession.objects.filter(mentor=user)
        return LessonSession.objects.filter(student=user)

    def create(self, request, *args, **kwargs):
        if request.user.role != 'mentor':
            return Response(
                {'detail': 'Sadece mentorlar ders oluşturabilir.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            mentor=request.user,
            room_code=LessonSession.generate_room_code(),
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LessonDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_authorized(self, request, code):
        session = get_object_or_404(LessonSession, room_code=code)
        user = request.user
        if user != session.mentor and user != session.student:
            return None, Response(
                {'detail': 'Bu derse erişim izniniz yok.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return session, None

    def get(self, request, code):
        session, err = self._get_authorized(request, code)
        if err:
            return err
        return Response(LessonSessionDetailSerializer(session).data)

    def patch(self, request, code):
        session, err = self._get_authorized(request, code)
        if err:
            return err
        if session.status == LessonSession.STATUS_ENDED:
            return Response(
                {'detail': 'Tamamlanmış bir dersi düzenleyemezsiniz.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = LessonSessionDetailSerializer(session, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class JoinLessonView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        session = get_object_or_404(LessonSession, room_code=code)
        user = request.user

        # Mentor kendi dersine giriyor
        if user == session.mentor:
            if session.status == LessonSession.STATUS_WAITING:
                session.status = LessonSession.STATUS_ACTIVE
                session.started_at = timezone.now()
                session.save()
            return Response(LessonSessionDetailSerializer(session).data)

        # Öğrenci katılıyor
        if session.status == LessonSession.STATUS_ENDED:
            return Response(
                {'detail': 'Bu ders sona ermiş.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if session.student and session.student != user:
            return Response(
                {'detail': 'Bu derste zaten başka bir öğrenci var.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not session.student:
            session.student = user
        if session.status == LessonSession.STATUS_WAITING:
            session.status = LessonSession.STATUS_ACTIVE
            session.started_at = timezone.now()
        session.save()
        return Response(LessonSessionDetailSerializer(session).data)


class EndLessonView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        session = get_object_or_404(LessonSession, room_code=code)
        if request.user != session.mentor:
            return Response(
                {'detail': 'Sadece mentor dersi bitirebilir.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        session.status = LessonSession.STATUS_ENDED
        session.ended_at = timezone.now()
        session.save()
        return Response({'detail': 'Ders başarıyla tamamlandı.'})
