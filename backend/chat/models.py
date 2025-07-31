from django.db import models
from django.contrib.auth.models import User
from users.models import UserProfile


    
class Conversation(models.Model):
    participants = models.ManyToManyField(UserProfile, related_name='conversations')
    deleted_by = models.ManyToManyField(UserProfile, related_name='deleted_conversations', blank=True)
    # Track when each user deleted the conversation
    deletion_timestamps = models.JSONField(default=dict, blank=True)  # {user_id: timestamp}
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Conversation: {[p.phone_number for p in self.participants.all()]}'
    

class Message(models.Model):
    MESSAGE_TYPE_CHOICES = (
        ('text', 'Text'),
        ('audio', 'Audio'),
    )
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages", default=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    audio_data = models.BinaryField(null=True, blank=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES, default='text')
    timestamp = models.DateTimeField(auto_now_add=True)
    is_delivered = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f'Message from {self.sender.username} to {self.recipient.phone_number} at {self.timestamp}'