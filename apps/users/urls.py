from django.urls import path
from .views import (
    RegisterView, LoginView, MeView,
    VerifyEmailView, ResendVerificationView, ChangePasswordView,
    AdminUserListView, AdminUserDetailView, SiteSettingsView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', MeView.as_view(), name='me'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/settings/', SiteSettingsView.as_view(), name='site-settings'),
]
