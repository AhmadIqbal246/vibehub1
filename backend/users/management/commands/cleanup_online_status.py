from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
from users.models import UserProfile


class Command(BaseCommand):
    help = 'Set users offline if they have been inactive for more than specified minutes'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--inactive-minutes',
            type=int,
            default=15,  # Default 15 minutes of inactivity
            help='Number of minutes of inactivity before setting user offline (default: 15)',
        )
        
    def handle(self, *args, **options):
        inactive_minutes = options['inactive_minutes']
        cutoff_time = timezone.now() - timedelta(minutes=inactive_minutes)
        
        # Find users who are marked as online but haven't been seen recently
        inactive_users = UserProfile.objects.filter(
            Q(is_online=True) & 
            (Q(last_seen__lt=cutoff_time) | Q(last_seen__isnull=True))
        )
        
        count = inactive_users.count()
        
        if count > 0:
            # Update them to offline
            inactive_users.update(
                is_online=False,
                last_seen=timezone.now()
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully set {count} inactive users offline '
                    f'(inactive for more than {inactive_minutes} minutes)'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('No inactive users found to update')
            )
