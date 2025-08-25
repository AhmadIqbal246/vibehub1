from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from chat.tasks import send_email_notification, create_and_schedule_email_notification
from chat.models import EmailNotification, Message
from django.contrib.auth.models import User
from users.models import UserProfile
from django.utils import timezone


class Command(BaseCommand):
    help = 'Test email and Celery functionality'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--test-email',
            type=str,
            help='Email address to send test email to',
        )
        parser.add_argument(
            '--test-celery',
            action='store_true',
            help='Test Celery task execution',
        )
        
    def handle(self, *args, **options):
        if options['test_email']:
            self.test_direct_email(options['test_email'])
            
        if options['test_celery']:
            self.test_celery_tasks()
            
        if not options['test_email'] and not options['test_celery']:
            self.stdout.write('Please specify --test-email or --test-celery')
    
    def test_direct_email(self, email):
        """Test sending email directly (not through Celery)"""
        self.stdout.write('Testing direct email sending...')
        
        try:
            send_mail(
                subject='Test Email from Django',
                message='This is a test email to verify email configuration is working.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            self.stdout.write(
                self.style.SUCCESS(f'✅ Direct email sent successfully to {email}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Direct email failed: {str(e)}')
            )
    
    def test_celery_tasks(self):
        """Test Celery task functionality"""
        self.stdout.write('Testing Celery tasks...')
        
        try:
            # Test 1: Simple Celery task
            from backend.celery import debug_task
            result = debug_task.delay()
            self.stdout.write(f'Debug task submitted: {result.id}')
            
            # Test 2: Create a test email notification
            # Find a user to test with
            test_user = User.objects.first()
            if not test_user:
                self.stdout.write(
                    self.style.WARNING('No users found in database. Create a user first.')
                )
                return
                
            # Always create a new test message
            from chat.models import Conversation
            test_profile = UserProfile.objects.filter(user=test_user).first()
            if not test_profile:
                self.stdout.write(
                    self.style.ERROR('No user profile found. Please ensure users have profiles.')
                )
                return
            
            # Create or get a conversation
            conversation = Conversation.objects.first()
            if not conversation:
                conversation = Conversation.objects.create()
                conversation.participants.add(test_profile)
            
            test_message = Message.objects.create(
                conversation=conversation,
                sender=test_user,
                recipient=test_profile,
                content=f'Test message for Celery email testing - {timezone.now()}',
                message_type='text',
                is_read=False  # Ensure message is unread
            )
            
            # Ensure recipient profile is offline for test
            test_profile = test_message.recipient
            test_profile.is_online = False
            test_profile.save()
            
            # Create a test email notification directly
            email_notification = EmailNotification.objects.create(
                message=test_message,  # Use actual message
                recipient=test_user,
                recipient_email=test_user.email or 'test@example.com',
                scheduled_for=timezone.now(),
                subject='Test Celery Email',
                body='This is a test email sent through Celery task.',
                is_first_reminder=True,
                is_follow_up=False
            )
            
            # Test 3: Send email through Celery
            task_result = send_email_notification.delay(email_notification.id)
            self.stdout.write(f'Email task submitted: {task_result.id}')
            
            # Wait a moment and check result
            import time
            time.sleep(2)
            
            # Check task status
            if task_result.ready():
                result = task_result.result
                if task_result.successful():
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Celery email task completed: {result}')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'❌ Celery email task failed: {result}')
                    )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⏳ Celery task still running: {task_result.id}')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Celery test failed: {str(e)}')
            )
