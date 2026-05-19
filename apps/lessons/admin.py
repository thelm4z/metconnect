from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import LessonSession


@admin.register(LessonSession)
class LessonSessionAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'mentor', 'student_display', 'status_badge',
        'code_language', 'room_code_chip', 'duration_display', 'created_at',
    ]
    list_filter = ['status', 'code_language', 'created_at']
    search_fields = ['title', 'room_code', 'mentor__username', 'student__username']
    readonly_fields = ['room_code', 'created_at', 'started_at', 'ended_at']
    ordering = ['-created_at']
    list_per_page = 20
    date_hierarchy = 'created_at'
    actions = ['end_sessions', 'delete_ended_sessions']

    fieldsets = (
        ('Ders Bilgileri', {
            'fields': ('title', 'room_code', 'code_language', 'status'),
        }),
        ('Katılımcılar', {
            'fields': ('mentor', 'student'),
        }),
        ('İçerik', {
            'fields': ('shared_notes', 'shared_code'),
            'classes': ('collapse',),
        }),
        ('Tarihler', {
            'fields': ('created_at', 'started_at', 'ended_at'),
        }),
    )

    @admin.display(description='Öğrenci')
    def student_display(self, obj):
        if obj.student:
            return obj.student.username
        return format_html('<em style="color:#94a3b8">Bekleniyor</em>')

    @admin.display(description='Durum')
    def status_badge(self, obj):
        config = {
            'waiting': ('#f59e0b', '#fef3c7', '⏳ Bekliyor'),
            'active':  ('#059669', '#d1fae5', '🟢 Aktif'),
            'ended':   ('#64748b', '#f1f5f9', '✅ Tamamlandı'),
        }
        color, bg, label = config.get(obj.status, ('#64748b', '#f1f5f9', obj.status))
        return format_html(
            '<span style="color:{};background:{};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700">{}</span>',
            color, bg, label
        )

    @admin.display(description='Oda Kodu')
    def room_code_chip(self, obj):
        return format_html(
            '<code style="background:#eef2ff;color:#4f46e5;padding:2px 8px;border-radius:6px;font-weight:700;letter-spacing:1px">{}</code>',
            obj.room_code
        )

    @admin.display(description='Süre')
    def duration_display(self, obj):
        if obj.started_at and obj.ended_at:
            delta = obj.ended_at - obj.started_at
            total_minutes = int(delta.total_seconds() / 60)
            return f'{total_minutes} dk'
        if obj.started_at and obj.status == 'active':
            delta = timezone.now() - obj.started_at
            total_minutes = int(delta.total_seconds() / 60)
            return format_html('<span style="color:#059669">{} dk (devam ediyor)</span>', total_minutes)
        return '—'

    @admin.action(description='⏹ Seçili dersleri bitir')
    def end_sessions(self, request, queryset):
        count = 0
        for session in queryset.exclude(status='ended'):
            session.status = 'ended'
            session.ended_at = timezone.now()
            session.save(update_fields=['status', 'ended_at'])
            count += 1
        self.message_user(request, f'{count} ders tamamlandı olarak işaretlendi.')

    @admin.action(description='🗑 Tamamlanmış dersleri sil')
    def delete_ended_sessions(self, request, queryset):
        count = queryset.filter(status='ended').count()
        queryset.filter(status='ended').delete()
        self.message_user(request, f'{count} tamamlanmış ders silindi.')
