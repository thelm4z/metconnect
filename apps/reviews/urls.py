from django.urls import path
from .views import ReviewListCreateView, ReviewDeleteView, AdminReviewListView, AdminReviewDeleteView

urlpatterns = [
    path('', ReviewListCreateView.as_view(), name='review-list'),
    path('<int:pk>/', ReviewDeleteView.as_view(), name='review-delete'),
    path('admin/all/', AdminReviewListView.as_view(), name='admin-review-list'),
    path('admin/<int:pk>/delete/', AdminReviewDeleteView.as_view(), name='admin-review-delete'),
]
