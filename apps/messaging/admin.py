from django.contrib import admin
from django.utils.html import format_html
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        'sender', 'receiver', 'content_preview',
        'is_read_icon', 'sent_at',
    ]
    list_filter = ['is_read', 'sent_at']
    search_fields = ['sender__username', 'receiver__username', 'content']
    readonly_fields = ['sender', 'receiver', 'content', 'sent_at']
    ordering = ['-sent_at']
    list_per_page = 30
    date_hierarchy = 'sent_at'
    actions = ['mark_as_read', 'mark_as_unread', 'delete_selected_messages']

    fieldsets = (
        ('Mesaj Bilgileri', {
            'fields': ('sender', 'receiver', 'sent_at', 'is_read'),
        }),
        ('İçerik', {
            'fields': ('content',),
        }),
    )

    @admin.display(description='İçerik')
    def content_preview(self, obj):
        preview = obj.content[:60] + ('...' if len(obj.content) > 60 else '')
        return format_html('<span title="{}">{}</span>', obj.content, preview)

    @admin.display(description='Okundu')
    def is_read_icon(self, obj):
        if obj.is_read:
            return format_html('<span style="color:#059669">✔ Okundu</span>')
        return format_html('<span style="color:#f59e0b">● Okunmadı</span>')

    @admin.action(description='✔ Okundu olarak işaretle')
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} mesaj okundu olarak işaretlendi.')

    @admin.action(description='● Okunmadı olarak işaretle')
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f'{updated} mesaj okunmadı olarak işaretlendi.')

    @admin.action(description='🗑 Seçili mesajları sil')
    def delete_selected_messages(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f'{count} mesaj silindi.')
