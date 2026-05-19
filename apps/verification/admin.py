from django.contrib import admin
from django.utils.html import format_html
from django.contrib import messages
from .models import Verification


@admin.register(Verification)
class VerificationAdmin(admin.ModelAdmin):
    list_display = [
        'mentor_username', 'mentor_email', 'status_badge',
        'applied_at', 'reviewed_at', 'cv_link',
    ]
    list_filter = ['status', 'applied_at', 'reviewed_at']
    search_fields = ['mentor__user__username', 'mentor__user__email', 'extra_note', 'admin_note']
    readonly_fields = ['mentor', 'cv_file', 'extra_note', 'applied_at', 'reviewed_at', 'cv_preview']
    ordering = ['-applied_at']
    list_per_page = 20
    actions = ['action_approve', 'action_reject']

    fieldsets = (
        ('Başvuru Bilgileri', {
            'fields': ('mentor', 'cv_preview', 'cv_file', 'extra_note', 'applied_at'),
        }),
        ('İnceleme', {
            'fields': ('status', 'admin_note', 'reviewed_at'),
        }),
    )

    @admin.display(description='Mentor')
    def mentor_username(self, obj):
        return obj.mentor.user.username

    @admin.display(description='E-posta')
    def mentor_email(self, obj):
        return obj.mentor.user.email

    @admin.display(description='Durum')
    def status_badge(self, obj):
        config = {
            'pending':  ('#f59e0b', '#fef3c7', '⏳ Beklemede'),
            'approved': ('#059669', '#d1fae5', '✅ Onaylandı'),
            'rejected': ('#ef4444', '#fef2f2', '❌ Reddedildi'),
        }
        color, bg, label = config.get(obj.status, ('#64748b', '#f1f5f9', obj.status))
        return format_html(
            '<span style="color:{};background:{};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700">{}</span>',
            color, bg, label
        )

    @admin.display(description='CV')
    def cv_link(self, obj):
        if obj.cv_file:
            return format_html('<a href="{}" target="_blank">📄 İndir</a>', obj.cv_file.url)
        return '—'

    @admin.display(description='CV Önizleme')
    def cv_preview(self, obj):
        if obj.cv_file:
            return format_html(
                '<a href="{}" target="_blank" style="display:inline-block;padding:8px 16px;'
                'background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">'
                '📄 CV\'yi Görüntüle / İndir</a>',
                obj.cv_file.url
            )
        return 'CV yüklenmemiş'

    @admin.action(description='✅ Seçili başvuruları ONAYLA')
    def action_approve(self, request, queryset):
        count = 0
        for v in queryset.filter(status='pending'):
            v.approve(admin_note='Admin tarafından onaylandı.')
            count += 1
        self.message_user(request, f'{count} başvuru onaylandı.', messages.SUCCESS)

    @admin.action(description='❌ Seçili başvuruları REDDET')
    def action_reject(self, request, queryset):
        count = 0
        for v in queryset.filter(status='pending'):
            v.reject(admin_note='Admin tarafından reddedildi.')
            count += 1
        self.message_user(request, f'{count} başvuru reddedildi.', messages.WARNING)

    def save_model(self, request, obj, form, change):
        if change and 'status' in form.changed_data:
            if obj.status == 'approved':
                obj.approve(obj.admin_note)
                return
            elif obj.status == 'rejected':
                obj.reject(obj.admin_note)
                return
        super().save_model(request, obj, form, change)
