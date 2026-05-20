from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from .models import User, EmailVerificationCode, SiteSettings


class EmailVerificationInline(admin.TabularInline):
    model = EmailVerificationCode
    extra = 0
    readonly_fields = ['code', 'created_at']
    can_delete = True
    verbose_name = 'E-posta Doğrulama Kodu'
    verbose_name_plural = 'E-posta Doğrulama Kodları'


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    def get_urls(self):
        urls = super().get_urls()
        extra = [
            path('security-logs/', self.admin_site.admin_view(self._security_logs_view), name='security_logs'),
        ]
        return extra + urls

    def _security_logs_view(self, request):
        import re
        from django.conf import settings as djsettings

        log_file = djsettings.BASE_DIR / 'logs' / 'security.log'

        LINE_RE  = re.compile(r'^\[(?P<ts>[^\]]+)\]\s+(?P<level>\w+)\s+\S+:\s+(?P<body>.+)$')
        IP_RE    = re.compile(r'\bip=(\S+)')
        PATH_RE  = re.compile(r'\bpath=(\S+)')
        REASON_RE = re.compile(r'\breason=(\S+)')

        level_filter = request.GET.get('level', '').upper()
        event_filter = request.GET.get('event', '').upper()
        search       = request.GET.get('q', '').lower()

        entries = []
        total_lines = 0
        error_msg = None

        try:
            with open(log_file, encoding='utf-8', errors='replace') as f:
                raw_lines = [l.strip() for l in f if l.strip()]
            total_lines = len(raw_lines)

            for line in reversed(raw_lines):
                m = LINE_RE.match(line)
                if not m:
                    continue
                ts    = m.group('ts')
                level = m.group('level')
                body  = m.group('body')

                parts = body.split(None, 1)
                event_type = parts[0] if parts else body
                rest       = parts[1] if len(parts) > 1 else ''

                if level_filter and level != level_filter:
                    continue
                if event_filter and event_type != event_filter:
                    continue

                ip_m  = IP_RE.search(rest)
                p_m   = PATH_RE.search(rest)
                rs_m  = REASON_RE.search(rest)

                entry = {
                    'timestamp':  ts,
                    'level':      level,
                    'event_type': event_type,
                    'ip':         ip_m.group(1)  if ip_m  else '—',
                    'path':       p_m.group(1)   if p_m   else '—',
                    'reason':     rs_m.group(1)  if rs_m  else '—',
                    'raw':        line,
                }

                if search and not any(search in str(v).lower() for v in entry.values()):
                    continue

                entries.append(entry)

        except FileNotFoundError:
            error_msg = 'Log dosyası bulunamadı: ' + str(log_file)
        except Exception as e:
            error_msg = str(e)

        attacks  = sum(1 for e in entries if e['event_type'] == 'ATTACK_DETECTED')
        ratelim  = sum(1 for e in entries if e['event_type'] in ('RATE_LIMIT', 'LOGIN_LOCKOUT'))

        return render(request, 'admin/users/security_logs.html', {
            'title':        'Güvenlik Logları',
            'opts':         self.model._meta,
            'entries':      entries,
            'total_lines':  total_lines,
            'shown':        len(entries),
            'attacks':      attacks,
            'ratelimit':    ratelim,
            'error_msg':    error_msg,
            'level_filter': level_filter,
            'event_filter': event_filter,
            'search':       search,
        })


    list_display = [
        'username', 'email', 'full_name', 'role_badge',
        'is_active_icon', 'email_verified_icon', 'is_staff', 'date_joined',
    ]
    list_filter = ['role', 'is_staff', 'is_active', 'is_email_verified', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    list_per_page = 25
    date_hierarchy = 'date_joined'
    inlines = [EmailVerificationInline]
    actions = ['activate_users', 'deactivate_users', 'mark_email_verified']

    fieldsets = UserAdmin.fieldsets + (
        ('Mentonnect Bilgileri', {
            'fields': ('role', 'bio', 'is_email_verified'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Ad Soyad')
    def full_name(self, obj):
        name = f'{obj.first_name} {obj.last_name}'.strip()
        return name or '—'

    @admin.display(description='Rol')
    def role_badge(self, obj):
        colors = {'mentor': '#7c3aed', 'student': '#2563eb', 'admin': '#dc2626'}
        labels = {'mentor': '👨‍💼 Mentor', 'student': '🎓 Öğrenci', 'admin': '🛡️ Admin'}
        color = colors.get(obj.role, '#64748b')
        label = labels.get(obj.role, obj.role)
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600">{}</span>',
            color, label
        )

    @admin.display(description='Aktif', boolean=False)
    def is_active_icon(self, obj):
        if obj.is_active:
            return format_html('<span style="color:#059669;font-size:16px">✔</span>')
        return format_html('<span style="color:#ef4444;font-size:16px">✘</span>')

    @admin.display(description='E-posta Onaylı', boolean=False)
    def email_verified_icon(self, obj):
        if obj.is_email_verified:
            return format_html('<span style="color:#059669;font-size:16px">✔</span>')
        return format_html('<span style="color:#f59e0b;font-size:16px">⏳</span>')

    @admin.action(description='Seçili kullanıcıları aktifleştir')
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} kullanıcı aktifleştirildi.')

    @admin.action(description='Seçili kullanıcıları devre dışı bırak')
    def deactivate_users(self, request, queryset):
        updated = queryset.exclude(pk=request.user.pk).update(is_active=False)
        self.message_user(request, f'{updated} kullanıcı devre dışı bırakıldı.')

    @admin.action(description='E-posta doğrulandı olarak işaretle')
    def mark_email_verified(self, request, queryset):
        updated = queryset.update(is_email_verified=True)
        self.message_user(request, f'{updated} kullanıcının e-postası doğrulandı olarak işaretlendi.')


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ['site_title', 'registration_open', 'maintenance_mode', 'updated_at']
    readonly_fields = ['updated_at']

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
