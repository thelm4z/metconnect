from django.urls import path
from .views import VerificationApplyView, VerificationListView, VerificationReviewView

urlpatterns = [
    path('', VerificationListView.as_view(), name='verification-list'),
    path('apply/', VerificationApplyView.as_view(), name='verification-apply'),
    path('<int:pk>/review/', VerificationReviewView.as_view(), name='verification-review'),
]
