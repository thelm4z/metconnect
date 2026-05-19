from django.contrib import admin
from django.utils.html import format_html
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        'student', 'mentor_username', 'rating_stars', 'comment_preview',
        'created_at',
    ]
    list_filter = ['rating', 'created_at']
    search_fields = [
        'student__username', 'student__email',
        'mentor__user__username', 'comment',
    ]
    readonly_fields = ['student', 'mentor', 'rating', 'created_at']
    ordering = ['-created_at']
    list_per_page = 25
    date_hierarchy = 'created_at'
    actions = ['delete_selected_reviews']

    fieldsets = (
        ('Yorum Bilgileri', {
            'fields': ('student', 'mentor', 'rating', 'created_at'),
        }),
        ('İçerik', {
            'fields': ('comment',),
        }),
    )

    @admin.display(description='Mentor')
    def mentor_username(self, obj):
        return obj.mentor.user.username

    @admin.display(description='Puan')
    def rating_stars(self, obj):
        stars = '★' * obj.rating + '☆' * (5 - obj.rating)
        colors = {1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#84cc16', 5: '#22c55e'}
        color = colors.get(obj.rating, '#f59e0b')
        return format_html('<span style="color:{};font-size:15px;letter-spacing:1px">{}</span>', color, stars)

    @admin.display(description='Yorum')
    def comment_preview(self, obj):
        if obj.comment:
            preview = obj.comment[:80] + ('...' if len(obj.comment) > 80 else '')
            return format_html('<span title="{}">{}</span>', obj.comment, preview)
        return format_html('<em style="color:#94a3b8">Yorum yok</em>')

    @admin.action(description='🗑 Seçili yorumları sil')
    def delete_selected_reviews(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f'{count} yorum silindi.')
