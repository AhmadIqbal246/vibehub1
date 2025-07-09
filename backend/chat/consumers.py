import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from users.models import UserProfile
from .models import Conversation, Message
from .serializers import MessageSerializer
from asgiref.sync import sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            content = data.get('content')
            sender_username = data.get('sender_username')  # or sender_phone if you use phone
            recipient_phone = data.get('recipient_phone', None)  # Optional, for new conv

            # Find sender User and UserProfile
            sender_user = await sync_to_async(User.objects.get)(username=sender_username)
            sender_profile = await sync_to_async(UserProfile.objects.get)(user=sender_user)

            # Fetch conversation
            conversation = await sync_to_async(Conversation.objects.get)(id=self.conversation_id)

            # Find recipient: all participants except the sender
            participants = await sync_to_async(lambda: list(conversation.participants.all()))()
            recipient_profiles = [p for p in participants if p.id != sender_profile.id]
            recipient_profile = recipient_profiles[0] if recipient_profiles else None

            # Create the message
            message = await sync_to_async(Message.objects.create)(
                conversation=conversation,
                sender=sender_user,
                recipient=recipient_profile,
                content=content
            )

            # Serialize the message for broadcast
            serializer = MessageSerializer(message)
            response_data = serializer.data

            # Broadcast to the group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": response_data,
                }
            )
        except Exception as e:
            await self.send(text_data=json.dumps({'error': str(e)}))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event["message"]))