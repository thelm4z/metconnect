from django.contrib import admin
from django.utils.html import format_html
from .models import MentorProfile, MentorTag


class MentorTagInline(admin.TabularInline):
    model = MentorTag
    extra = 1
    verbose_name = 'Etiket'
    verbose_name_plural = 'Uzmanlık Etiketleri'


class VerificationInline(admin.StackedInline):
    verbose_name = 'Doğrulama Başvurusu'
    verbose_name_plural = 'Doğrulama Başvurusu'
    extra = 0
    readonly_fields = ['applied_at', 'reviewed_at']
    can_delete = False

    def get_queryset(self, request):
        try:
            from apps.verification.models import Verification
            self.model = Verification
            return super().get_queryset(request)
        except Exception:
            from apps.verification.models import Verification
            self.model = Verification
            return Verification.objects.none()

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(MentorProfile)
class MentorProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'user_email', 'verified_badge', 'avg_rating_stars',
        'years_experience', 'tag_list', 'created_at',
    ]
    list_filter = ['is_verified', 'years_experience', 'created_at']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name', 'bio']
    readonly_fields = ['avg_rating', 'created_at', 'updated_at']
    ordering = ['-created_at']
    list_per_page = 20
    inlines = [MentorTagInline]
    actions = ['verify_mentors', 'unverify_mentors']

    fieldsets = (
        ('Kullanıcı', {'fields': ('user',)}),
        ('Profil', {'fields': ('bio', 'years_experience', 'linkedin_url')}),
        ('Durum', {'fields': ('is_verified', 'avg_rating')}),
        ('Tarihler', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    @admin.display(description='E-posta')
    def user_email(self, obj):
        return obj.user.email

    @admin.display(description='Doğrulandı')
    def verified_badge(self, obj):
        if obj.is_verified:
            return format_html('<span style="color:#059669;font-weight:700">✅ Doğrulandı</span>')
        return format_html('<span style="color:#94a3b8">— Doğrulanmadı</span>')

    @admin.display(description='Ortalama Puan')
    def avg_rating_stars(self, obj):
        stars = '★' * int(round(obj.avg_rating)) + '☆' * (5 - int(round(obj.avg_rating)))
        avg_str = f'{obj.avg_rating:.1f}'
        return format_html(
            '<span style="color:#f59e0b;letter-spacing:1px">{}</span> <small style="color:#64748b">({}/5)</small>',
            stars, avg_str
        )

    @admin.display(description='Etiketler')
    def tag_list(self, obj):
        tags = obj.tags.all()[:5]
        if not tags:
            return '—'
        html = ' '.join(
            f'<span style="background:#eef2ff;color:#4f46e5;padding:2px 7px;border-radius:8px;font-size:11px;font-weight:600">{t.name}</span>'
            for t in tags
        )
        return format_html(html)

    @admin.action(description='✅ Seçili mentorları doğrulanmış yap')
    def verify_mentors(self, request, queryset):
        updated = queryset.update(is_verified=True)
        queryset.filter(user__is_active=False).update(user__is_active=True)
        self.message_user(request, f'{updated} mentor doğrulandı.')

    @admin.action(description='❌ Seçili mentorların doğrulamasını kaldır')
    def unverify_mentors(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f'{updated} mentorun doğrulaması kaldırıldı.')


@admin.register(MentorTag)
class MentorTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'mentor']
    search_fields = ['name', 'mentor__user__username']
    list_filter = ['name']
