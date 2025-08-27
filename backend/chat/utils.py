from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .serializers import ConversationSerializer
from django.contrib.auth.models import User


def send_conversation_update(conversation, is_new=False, request=None):
    """
    Send real-time conversation update to all participants
    """
    import logging
    import traceback
    logger = logging.getLogger(__name__)
    
    logger.info(f"[REALTIME] Starting conversation update for conversation {conversation.id}, is_new: {is_new}")
    
    try:
        channel_layer = get_channel_layer()
        
        if not channel_layer:
            logger.error(f"[REALTIME] No channel layer available for conversation {conversation.id}")
            return
        
        # Create a mock request object if not provided
        if not request:
            logger.info(f"[REALTIME] Creating mock request for conversation {conversation.id}")
            class MockRequest:
                def build_absolute_uri(self, path):
                    from django.conf import settings
                    return f"{settings.BASE_API_URL}{path}"
            request = MockRequest()
        
        # Serialize the conversation
        logger.info(f"[REALTIME] Serializing conversation {conversation.id}")
        try:
            serializer = ConversationSerializer(conversation, context={'request': request})
            conversation_data = serializer.data
            logger.info(f"[REALTIME] Serialization successful for conversation {conversation.id}")
        except Exception as e:
            logger.error(f"[REALTIME] Failed to serialize conversation {conversation.id}: {str(e)}")
            logger.error(f"[REALTIME] Serialization traceback: {traceback.format_exc()}")
            raise
        
        # Get participants
        participants = list(conversation.participants.all())
        logger.info(f"[REALTIME] Found {len(participants)} participants for conversation {conversation.id}")
        
        # Send update to all participants
        for participant in participants:
            user_group_name = f'user_conversations_{participant.user.id}'
            logger.info(f"[REALTIME] Sending update to user {participant.user.username} (group: {user_group_name})")
            
            try:
                async_to_sync(channel_layer.group_send)(
                    user_group_name,
                    {
                        'type': 'conversation_update',
                        'conversation': conversation_data,
                        'is_new': is_new
                    }
                )
                logger.info(f"[REALTIME] Successfully sent update to user {participant.user.username}")
            except Exception as e:
                logger.error(f"[REALTIME] Failed to send update to user {participant.user.username}: {str(e)}")
                logger.error(f"[REALTIME] Group send traceback: {traceback.format_exc()}")
                # Continue with other participants even if one fails
                
        logger.info(f"[REALTIME] Completed conversation update for conversation {conversation.id}")
        
    except Exception as e:
        logger.error(f"[REALTIME] Critical error in send_conversation_update for conversation {conversation.id}: {str(e)}")
        logger.error(f"[REALTIME] Critical error traceback: {traceback.format_exc()}")
        raise


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
