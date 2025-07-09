from django.contrib import admin
from .models import Conversation, Message

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_participants', 'created_at', 'updated_at')
    search_fields = ('participants__phone_number',)
    ordering = ('-updated_at',)

    def get_participants(self, obj):
        return ", ".join([p.phone_number for p in obj.participants.all()])
    get_participants.short_description = 'Participants'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'sender', 'recipient', 'content', 'timestamp', 'is_delivered', 'is_read')
    search_fields = ('sender__username', 'recipient__phone_number', 'content')
    list_filter = ('is_delivered', 'is_read', 'timestamp')
    ordering = ('-timestamp',)