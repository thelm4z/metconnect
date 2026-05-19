from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponseRedirect
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/mentors/', include('apps.mentors.urls')),
    path('api/students/', include('apps.students.urls')),
    path('api/messages/', include('apps.messaging.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/verification/', include('apps.verification.urls')),
    path('api/chatbot/', include('apps.chatbot.urls')),
    path('api/lessons/', include('apps.lessons.urls')),
    path('', lambda request: HttpResponseRedirect(settings.SITE_URL)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
