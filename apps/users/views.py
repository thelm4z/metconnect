from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from .models import EmailVerificationCode
from .serializers import RegisterSerializer, UserSerializer, ChangePasswordSerializer, AdminUserSerializer, SiteSettingsSerializer
from .models import SiteSettings

User = get_user_model()


def send_verification_email(user, code):
    subject = 'Mentonnect – E-posta Doğrulama Kodunuz'
    message = (
        f'Merhaba {user.first_name or user.username},\n\n'
        f'Mentonnect hesabınızı doğrulamak için aşağıdaki 6 haneli kodu kullanın:\n\n'
        f'    {code}\n\n'
        f'Bu kod 10 dakika geçerlidir.\n\n'
        f'Eğer bu kaydı siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.\n\n'
        f'Mentonnect Ekibi'
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        cv_file = self.request.FILES.get('cv_file')
        extra_note = self.request.data.get('extra_note', '')
        user = serializer.save()
        code_obj = EmailVerificationCode.generate_for_user(user)
        send_verification_email(user, code_obj.code)

        if user.role == 'mentor':
            from apps.mentors.models import MentorProfile
            from apps.verification.models import Verification
            profile, _ = MentorProfile.objects.get_or_create(user=user)
            if cv_file:
                Verification.objects.create(
                    mentor=profile,
                    cv_file=cv_file,
                    extra_note=extra_note,
                )


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        code = request.data.get('code', '').strip()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Kullanıcı bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_email_verified:
            return Response({'detail': 'E-posta zaten doğrulanmış.'}, status=status.HTTP_200_OK)

        try:
            code_obj = user.email_verification
        except EmailVerificationCode.DoesNotExist:
            return Response({'detail': 'Doğrulama kodu bulunamadı. Lütfen tekrar gönderin.'}, status=status.HTTP_400_BAD_REQUEST)

        if not code_obj.is_valid():
            return Response({'detail': 'Kodun süresi dolmuş. Lütfen yeni kod isteyin.'}, status=status.HTTP_400_BAD_REQUEST)

        if code_obj.code != code:
            return Response({'detail': 'Geçersiz doğrulama kodu.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_email_verified = True
        user.save()
        code_obj.delete()
        return Response({'detail': 'E-posta başarıyla doğrulandı!'}, status=status.HTTP_200_OK)


class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Kullanıcı bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_email_verified:
            return Response({'detail': 'E-posta zaten doğrulanmış.'}, status=status.HTTP_200_OK)

        code_obj = EmailVerificationCode.generate_for_user(user)
        send_verification_email(user, code_obj.code)
        return Response({'detail': 'Doğrulama kodu tekrar gönderildi.'}, status=status.HTTP_200_OK)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # is_active=False ise super() "credentials bulunamadı" der — önce kontrol et
        from django.contrib.auth import get_user_model
        UserModel = get_user_model()
        username_field = self.username_field
        try:
            candidate = UserModel.objects.get(**{username_field: attrs.get(username_field, '')})
            if not candidate.is_active:
                if candidate.role == 'mentor':
                    try:
                        v = candidate.mentor_profile.verification
                        if v.status == 'rejected':
                            raise AuthenticationFailed(
                                f'Mentor başvurunuz reddedildi. '
                                f'Sebep: {v.admin_note or "Belirtilmedi"}. '
                                'Detay için yönetici ile iletişime geçin.'
                            )
                    except AuthenticationFailed:
                        raise
                    except Exception:
                        pass
                raise AuthenticationFailed('Hesabınız devre dışı bırakılmıştır. Yönetici ile iletişime geçin.')
        except UserModel.DoesNotExist:
            pass

        data = super().validate(attrs)

        if not self.user.is_email_verified:
            raise AuthenticationFailed(
                'E-posta adresiniz doğrulanmamış. Lütfen e-postanıza gelen kodu girerek doğrulayın.'
            )
        return data


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'detail': 'Şifre başarıyla değiştirildi.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all().order_by('-date_joined')


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        new_password = request.data.get('new_password', '').strip()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if new_password:
            if len(new_password) < 6:
                return Response({'detail': 'Şifre en az 6 karakter olmalıdır.'}, status=status.HTTP_400_BAD_REQUEST)
            instance.set_password(new_password)
            instance.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response({'detail': 'Kendi hesabınızı silemezsiniz.'}, status=status.HTTP_400_BAD_REQUEST)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SiteSettingsView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get(self, request):
        return Response(SiteSettingsSerializer(SiteSettings.get()).data)

    def patch(self, request):
        serializer = SiteSettingsSerializer(SiteSettings.get(), data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
