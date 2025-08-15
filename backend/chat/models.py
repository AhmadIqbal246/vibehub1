from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
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


@receiver(post_save, sender=Message)
def trigger_email_notification(sender, instance, created, **kwargs):
    """Automatically trigger email notification when a new message is created"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"[SIGNAL] Message post_save signal triggered: Message {instance.id}, created={created}")
    
    if created:  # Only for new messages
        logger.info(f"[SIGNAL] Processing new message {instance.id}")
        # Check if recipient is offline and has email
        recipient_profile = instance.recipient
        is_recipient_online = recipient_profile.is_online
        recipient_email = recipient_profile.user.email
        
        if not is_recipient_online and recipient_email:
            # Import here to avoid circular imports
            try:
                from .tasks import create_and_schedule_email_notification
                
                # Schedule email notification
                result = create_and_schedule_email_notification.delay(instance.id)
                
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"[SIGNAL] Email notification scheduled for message {instance.id} to {recipient_email} - Task ID: {result.id}")
                
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"[SIGNAL] Failed to schedule email notification for message {instance.id}: {str(e)}")
        else:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"[SIGNAL] Skipping email for message {instance.id} - Recipient online: {is_recipient_online}, Has email: {bool(recipient_email)}")


@receiver(post_save, sender=Message)
def cancel_email_notification_on_read(sender, instance, created, **kwargs):
    """Cancel email notifications when a message is marked as read"""
    if not created and instance.is_read:  # Only for existing messages that are now read
        try:
            from .tasks import cancel_pending_notifications_for_message
            
            # Cancel pending email notifications
            result = cancel_pending_notifications_for_message.delay(instance.id)
            
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"[SIGNAL] Email notifications cancelled for read message {instance.id} - Task ID: {result.id}")
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"[SIGNAL] Failed to cancel email notifications for message {instance.id}: {str(e)}")
