from django.urls import path
from .views import send_message, user_conversations,conversation_messages,send_message_in_conversation,create_conversation

urlpatterns = [
    path('send-message/', send_message, name='send_message'),
    path('conversations/', user_conversations, name='user_conversations'),
    path('conversation/<int:conversation_id>/messages/', conversation_messages, name='conversation_messages'),
    path('conversation/<int:conversation_id>/send-message/', send_message_in_conversation, name='send_message_in_conversation'),
    path('create-conversation/', create_conversation, name='create_conversation'),
    
]