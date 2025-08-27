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


# Notification utility functions
def calculate_user_total_unread_count(user_profile):
    """Calculate total unread messages for a user across all conversations"""
    from .models import Conversation
    return Conversation.get_total_unread_count_for_user(user_profile)


def send_notification_count_update(user_id, total_count, conversation_counts=None):
    """Send real-time notification count update via WebSocket"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        channel_layer = get_channel_layer()
        
        if not channel_layer:
            logger.error(f"[NOTIFICATION] No channel layer available for user {user_id}")
            return
        
        user_group_name = f'user_notifications_{user_id}'
        
        notification_data = {
            'total_unread_count': total_count,
            'conversation_counts': conversation_counts or {}
        }
        
        async_to_sync(channel_layer.group_send)(
            user_group_name,
            {
                'type': 'notification_count_update',
                'notification_data': notification_data
            }
        )
        
        logger.info(f"[NOTIFICATION] Sent count update to user {user_id}: total={total_count}")
        
    except Exception as e:
        logger.error(f"[NOTIFICATION] Failed to send count update to user {user_id}: {str(e)}")


def broadcast_unread_count_change(user_profile, conversation_id=None):
    """Broadcast unread count changes to user's connected clients"""
    from .models import Conversation
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Calculate total unread count
        total_count = calculate_user_total_unread_count(user_profile)
        
        # Calculate individual conversation counts if needed
        conversation_counts = {}
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id)
                conversation_counts[str(conversation_id)] = conversation.get_unread_count_for_user(user_profile)
            except Conversation.DoesNotExist:
                pass
        
        # Send the update
        send_notification_count_update(user_profile.user.id, total_count, conversation_counts)
        
        logger.info(f"[NOTIFICATION] Broadcasted count change for user {user_profile.user.username}: total={total_count}")
        
    except Exception as e:
        logger.error(f"[NOTIFICATION] Failed to broadcast count change for user {user_profile.user.username}: {str(e)}")
