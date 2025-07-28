from rest_framework import serializers
from .models import Message, Conversation
from users.models import UserProfile
from django.contrib.auth.models import User

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['username', 'first_name', 'last_name', 'email', 'phone_number', 'profile_picture_url']

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username')
    sender_profile_picture = serializers.SerializerMethodField()
    recipient_profile_picture = serializers.SerializerMethodField()
    audio_data_base64 = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'content', 'timestamp', 'is_delivered', 'is_read', 
                 'sender_username', 'sender_profile_picture', 'recipient_profile_picture',
                 'message_type', 'audio_data_base64']
    
    def get_audio_data_base64(self, obj):
        if obj.message_type == 'audio' and obj.audio_data:
            import base64
            return base64.b64encode(obj.audio_data).decode('utf-8')
        return None

    def get_sender_profile_picture(self, obj):
        if obj.sender.userprofile.profile_picture:
            return self.context['request'].build_absolute_uri(obj.sender.userprofile.profile_picture.url)
        return None

    def get_recipient_profile_picture(self, obj):
        if obj.recipient.profile_picture:
            return self.context['request'].build_absolute_uri(obj.recipient.profile_picture.url)
        return None

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserProfileSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'created_at', 'updated_at', 'last_message', 'unread_count']

    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-timestamp').first()
        if last_message:
            return MessageSerializer(last_message, context=self.context).data
        return None

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(recipient__user=user, is_read=False).count()