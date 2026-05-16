from django.urls import path
from .views import MessageListCreateView, MessageMarkReadView, UnreadCountView, MarkConversationReadView

urlpatterns = [
    path('', MessageListCreateView.as_view(), name='message-list'),
    path('<int:pk>/read/', MessageMarkReadView.as_view(), name='message-read'),
    path('unread-count/', UnreadCountView.as_view(), name='unread-count'),
    path('mark-read/', MarkConversationReadView.as_view(), name='mark-read'),
]
