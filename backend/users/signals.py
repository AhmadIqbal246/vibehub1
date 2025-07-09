# users/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile
import random

def generate_unique_phone_number():
    while True:
        number = f"03{random.randint(100000000, 999999999)}"
        if not UserProfile.objects.filter(phone_number=number).exists():
            return number

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        phone = generate_unique_phone_number()
        UserProfile.objects.create(user=instance, phone_number=phone)
