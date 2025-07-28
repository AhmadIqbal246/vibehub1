from django.urls import path
from .views import send_message, user_conversations, conversation_messages, send_message_in_conversation, create_conversation, edit_message, delete_message

urlpatterns = [
    path('send-message/', send_message, name='send_message'),
    path('conversations/', user_conversations, name='user_conversations'),
    path('conversation/<int:conversation_id>/messages/', conversation_messages, name='conversation_messages'),
    path('conversation/<int:conversation_id>/send-message/', send_message_in_conversation, name='send_message_in_conversation'),
    path('create-conversation/', create_conversation, name='create_conversation'),
    path('message/<int:message_id>/edit/', edit_message, name='edit_message'),
    path('message/<int:message_id>/delete/', delete_message, name='delete_message')
]