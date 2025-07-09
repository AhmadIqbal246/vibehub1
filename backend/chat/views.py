from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from users.models import UserProfile
from .models import Conversation, Message
from .serializers import MessageSerializer,ConversationSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    sender = request.user
    recipient_phone = request.data.get('recipient_phone')
    content = request.data.get('content')

    if not recipient_phone or not content:
        return Response({"error": "Recipient phone and content are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        recipient_profile = UserProfile.objects.get(phone_number=recipient_phone)
    except UserProfile.DoesNotExist:
        return Response({"error": "Recipient not found."}, status=status.HTTP_404_NOT_FOUND)

    # Get or create conversation between the two users
    conversation = (
        Conversation.objects
        .filter(participants=sender.userprofile)
        .filter(participants=recipient_profile)
        .first()
    )
    if not conversation:
        conversation = Conversation.objects.create()
        conversation.participants.add(sender.userprofile, recipient_profile)
        conversation.save()

    # Create the message
    message = Message.objects.create(
        conversation=conversation,
        sender=sender,
        recipient=recipient_profile,
        content=content
    )

    # Optionally: Serialize and return the message
    serializer = MessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_conversations(request):
    user_profile = request.user.userprofile
    conversations = Conversation.objects.filter(participants=user_profile).order_by('-updated_at')
    serializer = ConversationSerializer(conversations, many=True)
    return Response(serializer.data)



# to fetch messages from the conversation 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_messages(request, conversation_id):
    try:
        conversation = Conversation.objects.get(id=conversation_id, participants=request.user.userprofile)
    except Conversation.DoesNotExist:
        return Response({"error": "Conversation not found or access denied."}, status=404)
    messages = Message.objects.filter(conversation=conversation).order_by('timestamp')
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message_in_conversation(request, conversation_id):
    user = request.user
    user_profile = user.userprofile
    content = request.data.get("content")

    if not content:
        return Response({"error": "Message content is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        conversation = Conversation.objects.get(id=conversation_id, participants=user_profile)
    except Conversation.DoesNotExist:
        return Response({"error": "Conversation not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

    # Find recipient: all participants except the sender
    recipients = conversation.participants.exclude(id=user_profile.id)
    if not recipients.exists():
        return Response({"error": "No recipient found."}, status=status.HTTP_400_BAD_REQUEST)
    recipient_profile = recipients.first()  # For 1-to-1 chats

    message = Message.objects.create(
        conversation=conversation,
        sender=user,
        recipient=recipient_profile,
        content=content
    )

    serializer = MessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_conversation(request):
    user_profile = request.user.userprofile
    recipient_phone = request.data.get("recipient_phone")
    if not recipient_phone:
        return Response({"error": "Recipient phone is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        recipient_profile = UserProfile.objects.get(phone_number=recipient_phone)
    except UserProfile.DoesNotExist:
        return Response({"error": "Recipient not found."}, status=status.HTTP_404_NOT_FOUND)

    # Check if conversation already exists
    conversation = (
        Conversation.objects
        .filter(participants=user_profile)
        .filter(participants=recipient_profile)
        .first()
    )
    if not conversation:
        conversation = Conversation.objects.create()
        conversation.participants.add(user_profile, recipient_profile)
        conversation.save()

    serializer = ConversationSerializer(conversation)
    return Response(serializer.data, status=status.HTTP_201_CREATED)




