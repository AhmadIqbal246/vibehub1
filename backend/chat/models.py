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
    
    def update_timestamp(self):
        """Update the conversation timestamp when a new message is added"""
        from django.utils import timezone
        self.updated_at = timezone.now()
        self.save(update_fields=['updated_at'])

    def __str__(self):
        return f'Conversation: {[p.phone_number for p in self.participants.all()]}'
    
    def get_unread_count_for_user(self, user_profile):
        """Get unread message count for a specific user in this conversation"""
        return self.messages.filter(
            recipient=user_profile,
            is_read=False
        ).count()
    
    @staticmethod
    def get_total_unread_count_for_user(user_profile):
        """Get total unread message count across all user's conversations"""
        from django.db.models import Count, Q
        return Message.objects.filter(
            recipient=user_profile,
            is_read=False,
            conversation__in=Conversation.objects.filter(
                participants=user_profile
            ).exclude(
                deleted_by=user_profile
            )
        ).count()
    

class Message(models.Model):
    MESSAGE_TYPE_CHOICES = (
        ('text', 'Text'),
        ('audio', 'Audio'),
    )
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages", default=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField(null=True, blank=True)
    audio_data = models.BinaryField(null=True, blank=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES, default='text')
    timestamp = models.DateTimeField(auto_now_add=True)
    is_delivered = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f'Message from {self.sender.username} to {self.recipient.phone_number} at {self.timestamp}'


class EmailNotification(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='email_notifications')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE)
    recipient_email = models.EmailField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timing fields
    created_at = models.DateTimeField(auto_now_add=True)
    scheduled_for = models.DateTimeField()  # When to send the email
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Email content
    subject = models.CharField(max_length=255)
    body = models.TextField()
    
    # Tracking fields
    celery_task_id = models.CharField(max_length=255, null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    
    # Retry tracking
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    
    # Email reminder specific fields
    is_first_reminder = models.BooleanField(default=True)
    is_follow_up = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'status']),
            models.Index(fields=['scheduled_for']),
            models.Index(fields=['message']),
        ]
    
    def __str__(self):
        return f"Email to {self.recipient_email} for message {self.message.id} - {self.status}"
    
    def mark_as_sent(self):
        """Mark email as successfully sent"""
        from django.utils import timezone
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at'])
    
    def mark_as_failed(self, error_message=None):
        """Mark email as failed"""
        self.status = 'failed'
        if error_message:
            self.error_message = error_message
        self.save(update_fields=['status', 'error_message'])
    
    def cancel(self):
        """Cancel pending email"""
        if self.status == 'pending':
            self.status = 'cancelled'
            self.save(update_fields=['status'])