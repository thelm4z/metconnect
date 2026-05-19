from django.urls import path
from . import views

urlpatterns = [
    path('', views.LessonListCreateView.as_view(), name='lesson-list-create'),
    path('<str:code>/', views.LessonDetailView.as_view(), name='lesson-detail'),
    path('<str:code>/join/', views.JoinLessonView.as_view(), name='lesson-join'),
    path('<str:code>/end/', views.EndLessonView.as_view(), name='lesson-end'),
]
