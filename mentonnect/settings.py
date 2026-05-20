from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

SITE_URL = config('SITE_URL', default='http://localhost:3000')

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'apps.users',
    'apps.mentors',
    'apps.students',
    'apps.messaging',
    'apps.reviews',
    'apps.verification',
    'apps.chatbot',
    'apps.lessons',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    # ── Güvenlik katmanları (erken çalışır) ──
    'mentonnect.security_middleware.RateLimitMiddleware',
    'mentonnect.security_middleware.InputSanitizationMiddleware',
    'mentonnect.security_middleware.SecurityHeadersMiddleware',
    # ──────────────────────────────────────────
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'mentonnect.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mentonnect.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'tr-tr'
TIME_ZONE = 'Europe/Istanbul'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
CORS_ALLOW_CREDENTIALS = True

# ── E-posta ayarları ──────────────────────────────────────────────────────────
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='Mentonnect <tthelm4z@gmail.com>')

# ── Güvenlik Ayarları ─────────────────────────────────────────────────────────

# Clickjacking koruması
X_FRAME_OPTIONS = 'DENY'

# MIME sniffing koruması
SECURE_CONTENT_TYPE_NOSNIFF = True

# Session güvenliği
SESSION_COOKIE_HTTPONLY = True       # JS ile session cookie okunamaz
SESSION_COOKIE_SAMESITE = 'Lax'     # CSRF saldırılarına karşı
SESSION_COOKIE_AGE = 3600 * 8       # 8 saat

# CSRF güvenliği
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = False         # Frontend'in CSRF token okuması için False

# Password validators — güçlü şifre zorunluluğu
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Loglama — güvenlik olayları için
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'security': {
            'format': '[%(asctime)s] %(levelname)s %(name)s: %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    },
    'handlers': {
        'security_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'security.log',
            'maxBytes': 5 * 1024 * 1024,  # 5 MB
            'backupCount': 5,
            'formatter': 'security',
            'encoding': 'utf-8',
        },
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'security',
        },
    },
    'loggers': {
        'mentonnect.security_middleware': {
            'handlers': ['security_file', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['security_file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# ── Jazzmin Admin Teması ──────────────────────────────────────────────────────
JAZZMIN_SETTINGS = {
    "site_title": "Mentonnect Admin",
    "site_header": "Mentonnect",
    "site_brand": "Mentonnect",
    "welcome_sign": "Mentonnect Yönetim Paneline Hoş Geldiniz",
    "copyright": "Mentonnect © 2025",
    "search_model": ["users.User", "mentors.MentorProfile", "lessons.LessonSession"],
    "topmenu_links": [
        {"name": "Siteye Dön", "url": "/", "new_window": True},
        {"model": "users.User"},
        {"name": "🔒 Güvenlik Logları", "url": "/admin/users/user/security-logs/", "new_window": False},
    ],
    "usermenu_links": [
        {"name": "Siteye Dön", "url": "/", "new_window": True},
    ],
    "show_sidebar": True,
    "navigation_expanded": True,
    "order_with_respect_to": [
        "users", "mentors", "students", "verification", "reviews",
        "messaging", "lessons",
    ],
    "icons": {
        "auth": "fas fa-shield-alt",
        "auth.Group": "fas fa-users-cog",
        "users.User": "fas fa-users",
        "users.SiteSettings": "fas fa-cog",
        "users.EmailVerificationCode": "fas fa-envelope-open-text",
        "mentors.MentorProfile": "fas fa-chalkboard-teacher",
        "mentors.MentorTag": "fas fa-tags",
        "students.StudentProfile": "fas fa-graduation-cap",
        "verification.Verification": "fas fa-user-check",
        "reviews.Review": "fas fa-star",
        "messaging.Message": "fas fa-comments",
        "lessons.LessonSession": "fas fa-book-open",
    },
    "default_icon_parents": "fas fa-folder",
    "default_icon_children": "fas fa-circle",
    "related_modal_active": True,
    "custom_css": None,
    "custom_js": None,
    "use_google_fonts_cdn": True,
    "show_ui_builder": False,
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "users.user": "collapsible",
    },
    "language_chooser": False,
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-indigo",
    "accent": "accent-indigo",
    "navbar": "navbar-dark",
    "no_navbar_border": True,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-indigo",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": True,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "default",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-outline-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },
    "actions_sticky_top": True,
}
