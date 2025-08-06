from django.urls import path
from .views import (
    SendMessageView,
    UserConversationsView,
    ConversationMessagesView,
    SendMessageInConversationView,
    CreateConversationView,
    EditMessageView,
    DeleteMessageView,
    DeleteConversationView
)

urlpatterns = [
    path('send-message/', SendMessageView.as_view(), name='send_message'),
    path('conversations/', UserConversationsView.as_view(), name='user_conversations'),
    path('conversation/<int:conversation_id>/messages/', ConversationMessagesView.as_view(), name='conversation_messages'),
    path('conversation/<int:conversation_id>/send-message/', SendMessageInConversationView.as_view(), name='send_message_in_conversation'),
    path('create-conversation/', CreateConversationView.as_view(), name='create_conversation'),
    path('message/<int:message_id>/edit/', EditMessageView.as_view(), name='edit_message'),
    path('message/<int:message_id>/delete/', DeleteMessageView.as_view(), name='delete_message'),
    path('conversation/<int:conversation_id>/delete/', DeleteConversationView.as_view(), name='delete_conversation')
]
