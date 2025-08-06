from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .serializers import ConversationSerializer
from django.contrib.auth.models import User


def send_conversation_update(conversation, is_new=False, request=None):
    """
    Send real-time conversation update to all participants
    """
    channel_layer = get_channel_layer()
    
    # Create a mock request object if not provided
    if not request:
        class MockRequest:
            def build_absolute_uri(self, path):
                from django.conf import settings
                return f"{settings.BASE_API_URL}{path}"
        request = MockRequest()
    
    # Serialize the conversation
    serializer = ConversationSerializer(conversation, context={'request': request})
    conversation_data = serializer.data
    
    # Send update to all participants
    for participant in conversation.participants.all():
        user_group_name = f'user_conversations_{participant.user.id}'
        async_to_sync(channel_layer.group_send)(
            user_group_name,
            {
                'type': 'conversation_update',
                'conversation': conversation_data,
                'is_new': is_new
            }
        )


def send_conversation_delete(conversation_id, user_id):
    """
    Send real-time conversation deletion update to a specific user
    """
    channel_layer = get_channel_layer()
    user_group_name = f'user_conversations_{user_id}'
    
    async_to_sync(channel_layer.group_send)(
        user_group_name,
        {
            'type': 'conversation_delete',
            'conversation_id': conversation_id
        }
    )
