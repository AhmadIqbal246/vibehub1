from rest_framework import serializers
from .models import Message,Conversation

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'

class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.StringRelatedField(many=True)
    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'created_at', 'updated_at']