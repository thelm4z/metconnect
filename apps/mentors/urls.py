from django.urls import path
from .views import MentorListView, MentorCreateView, MentorDetailView, MyMentorProfileView

urlpatterns = [
    path('', MentorListView.as_view(), name='mentor-list'),
    path('create/', MentorCreateView.as_view(), name='mentor-create'),
    path('my-profile/', MyMentorProfileView.as_view(), name='my-mentor-profile'),
    path('<int:pk>/', MentorDetailView.as_view(), name='mentor-detail'),
]
