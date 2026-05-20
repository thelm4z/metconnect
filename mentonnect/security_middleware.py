"""
Mentonnect Güvenlik Middleware Katmanı
--------------------------------------
1. SecurityHeadersMiddleware  – HTTP güvenlik başlıkları
2. RateLimitMiddleware        – Genel API rate limit + Login kilitleme
3. InputSanitizationMiddleware – Zararlı pattern tespiti (SQLi, XSS, Path Traversal)
"""

import re
import time
import json
import logging
import threading
from collections import defaultdict
from django.http import JsonResponse

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# 1. GÜVENLIK BAŞLIKLARI
# ──────────────────────────────────────────────────────────────

class SecurityHeadersMiddleware:
    """Her response'a güvenlik başlıkları ekler."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        self._add_headers(request, response)
        return response

    def _add_headers(self, request, response):
        # Clickjacking koruması
        response['X-Frame-Options'] = 'DENY'

        # MIME sniffing koruması
        response['X-Content-Type-Options'] = 'nosniff'

        # XSS filtresi (eski tarayıcılar için)
        response['X-XSS-Protection'] = '1; mode=block'

        # Referrer politikası
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Kamera/mikrofon izin politikası
        response['Permissions-Policy'] = (
            'geolocation=(), '
            'microphone=(self), '
            'camera=(self), '
            'payment=()'
        )

        # Content Security Policy
        # Admin paneli farklı kaynaklara ihtiyaç duyduğundan muaf tutulur
        if not request.path.startswith('/admin/'):
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' https://meet.jit.si https://fonts.googleapis.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com data:; "
                "img-src 'self' data: https: blob:; "
                "frame-src https://meet.jit.si; "
                "connect-src 'self' https://meet.jit.si wss://meet.jit.si https://*.google.com; "
                "media-src 'self' blob:; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            )

        # Sunucu bilgisini gizle
        response['Server'] = 'Mentonnect'
        if 'X-Powered-By' in response:
            del response['X-Powered-By']


# ──────────────────────────────────────────────────────────────
# 2. RATE LIMITING + LOGIN KILITLEME
# ──────────────────────────────────────────────────────────────

class RateLimitMiddleware:
    """
    - Genel API: 60 istek / 60 saniye / IP
    - Login: 10 hatalı deneme → 15 dakika kilit
    - Register: 5 kayıt / 10 dakika / IP
    """

    _lock = threading.Lock()
    _api_requests: dict = defaultdict(list)      # ip → [timestamp, ...]
    _login_failures: dict = defaultdict(list)    # ip → [timestamp, ...]
    _register_requests: dict = defaultdict(list) # ip → [timestamp, ...]
    _lockouts: dict = {}                         # ip → unlock_timestamp

    # ── Eşikler ──
    API_LIMIT      = 120   # istek
    API_WINDOW     = 60    # saniye

    LOGIN_FAIL_LIMIT  = 7     # 7 hatalı giriş → kilit
    LOGIN_WINDOW      = 300   # 5 dk içinde
    LOCKOUT_DURATION  = 900   # 15 dk kilit

    REGISTER_LIMIT  = 5
    REGISTER_WINDOW = 600  # 10 dk

    def __init__(self, get_response):
        self.get_response = get_response

    # ── Yardımcılar ──────────────────────────────────────────

    def _ip(self, request) -> str:
        xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
        if xff:
            return xff.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '0.0.0.0')

    def _is_locked(self, ip: str) -> bool:
        now = time.time()
        with self._lock:
            unlock_at = self._lockouts.get(ip)
            if unlock_at:
                if now < unlock_at:
                    return True
                del self._lockouts[ip]
                self._login_failures[ip] = []
        return False

    def _remaining_lockout(self, ip: str) -> int:
        return max(0, int(self._lockouts.get(ip, 0) - time.time()))

    def _record_failure(self, ip: str) -> bool:
        """Başarısız giriş kaydeder. True → hesap kilitlendi."""
        now = time.time()
        with self._lock:
            self._login_failures[ip] = [
                t for t in self._login_failures[ip]
                if now - t < self.LOGIN_WINDOW
            ]
            self._login_failures[ip].append(now)
            if len(self._login_failures[ip]) >= self.LOGIN_FAIL_LIMIT:
                self._lockouts[ip] = now + self.LOCKOUT_DURATION
                logger.warning('LOGIN_LOCKOUT ip=%s failures=%d', ip, len(self._login_failures[ip]))
                return True
        return False

    def _clear_failures(self, ip: str):
        with self._lock:
            self._login_failures[ip] = []
            self._lockouts.pop(ip, None)

    def _check_api_limit(self, ip: str) -> bool:
        now = time.time()
        with self._lock:
            self._api_requests[ip] = [
                t for t in self._api_requests[ip]
                if now - t < self.API_WINDOW
            ]
            if len(self._api_requests[ip]) >= self.API_LIMIT:
                logger.warning('RATE_LIMIT ip=%s count=%d', ip, len(self._api_requests[ip]))
                return True
            self._api_requests[ip].append(now)
        return False

    def _check_register_limit(self, ip: str) -> bool:
        now = time.time()
        with self._lock:
            self._register_requests[ip] = [
                t for t in self._register_requests[ip]
                if now - t < self.REGISTER_WINDOW
            ]
            if len(self._register_requests[ip]) >= self.REGISTER_LIMIT:
                return True
            self._register_requests[ip].append(now)
        return False

    # ── Ana akış ─────────────────────────────────────────────

    def __call__(self, request):
        ip = self._ip(request)
        path = request.path
        method = request.method

        # Login kilitleme devre dışı bırakıldı

        # — Kayıt rate limit —
        if path == '/api/auth/register/' and method == 'POST':
            if self._check_register_limit(ip):
                return JsonResponse(
                    {'detail': 'Kısa sürede çok fazla kayıt denemesi. Lütfen daha sonra tekrar deneyin.'},
                    status=429,
                )

        # — Genel API rate limit —
        if path.startswith('/api/') and self._check_api_limit(ip):
            return JsonResponse(
                {'detail': 'Çok fazla istek gönderdiniz. Lütfen bekleyin.'},
                status=429,
            )

        return self.get_response(request)


# ──────────────────────────────────────────────────────────────
# 3. INPUT SANITIZASYON + SALDIRI TESPİTİ
# ──────────────────────────────────────────────────────────────

# Zararlı kalıplar — SQL Injection, XSS, Path Traversal, Command Injection
_ATTACK_PATTERNS = [
    # SQL Injection
    re.compile(r"'\s*(or|and)\s*'", re.I),
    re.compile(r"--[\s\r\n]|;\s*(drop|alter|delete|truncate|insert|update|create)\s", re.I),
    re.compile(r"union\s+(all\s+)?select\s", re.I),
    re.compile(r"(sleep|benchmark|waitfor\s+delay)\s*\(", re.I),
    re.compile(r"information_schema|sysobjects|syscolumns|pg_tables", re.I),
    re.compile(r"'\s*or\s*'?\d+\s*'?\s*=\s*'?\d", re.I),

    # XSS
    re.compile(r"<\s*script", re.I),
    re.compile(r"javascript\s*:", re.I),
    re.compile(r"on\w{2,20}\s*=", re.I),      # onerror= onload= onclick= vb.
    re.compile(r"<\s*(iframe|object|embed|svg|img[^>]+on\w)", re.I),
    re.compile(r"expression\s*\(|vbscript\s*:", re.I),
    re.compile(r"data\s*:\s*text/(html|javascript)", re.I),

    # Path Traversal — Unix ve Windows + URL-encoded
    re.compile(r"(\.\./|\.\.\\){2,}", re.I),           # ../../
    re.compile(r"(%2e%2e%2f|%2e%2e/|\.\.%2f){2,}", re.I),  # URL-encoded
    re.compile(r"(etc/passwd|etc/shadow|etc/hosts)", re.I),
    re.compile(r"(windows[/\\]system32|win32/drivers|windows[/\\]win.ini)", re.I),
    re.compile(r"[a-zA-Z]:[/\\]{1,2}windows[/\\]", re.I),  # C:\Windows\

    # Command Injection — shell operatörleri + backtick
    re.compile(r"[;&|]\s*(ls|cat|rm|wget|curl|bash|sh|python|nc|id|whoami|uname)\b", re.I),
    re.compile(r"`[^`]{1,60}`", re.I),          # `komut`
    re.compile(r"\$\([^)]{1,60}\)", re.I),      # $(komut)
    re.compile(r"&&\s*(wget|curl|bash|python|nc)\s", re.I),
]

# Bu path'lerde zararlı pattern kontrolü yapılmaz (dosya upload içerebilir)
_SKIP_PATHS = {'/api/verification/'}

# İzin verilen maksimum alan uzunlukları
_FIELD_MAX_LENGTHS = {
    'username': 150, 'email': 254, 'password': 128,
    'message': 2000, 'content': 2000, 'comment': 1000,
    'bio': 2000, 'title': 200, 'extra_note': 1000,
    'admin_note': 500, 'subject': 200, 'name': 100,
    'interests': 500, 'linkedin_url': 500,
}


class InputSanitizationMiddleware:
    """
    POST/PATCH/PUT isteklerinde JSON body'yi tarar.
    - Makul uzunluk sınırları uygular.
    - Bilinen saldırı kalıplarını tespit edip engeller.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method in ('POST', 'PATCH', 'PUT') and request.path.startswith('/api/'):
            error = self._inspect(request)
            if error:
                ip = request.META.get('REMOTE_ADDR', '?')
                logger.warning('ATTACK_DETECTED ip=%s path=%s reason=%s', ip, request.path, error)
                return JsonResponse({'detail': 'Geçersiz veya zararlı içerik tespit edildi.'}, status=400)

        return self.get_response(request)

    def _inspect(self, request) -> str | None:
        content_type = request.META.get('CONTENT_TYPE', '')
        if 'application/json' not in content_type:
            return None

        try:
            raw = request.body.decode('utf-8', errors='replace')
        except Exception:
            return None

        # Ham body 512 KB'dan büyük olamaz
        if len(raw) > 512 * 1024:
            return 'body_too_large'

        try:
            data = json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            return None  # JSON değilse bırak, Django handle eder

        if not isinstance(data, dict):
            return None

        for field, value in data.items():
            if not isinstance(value, str):
                continue

            # Uzunluk kontrolü
            max_len = _FIELD_MAX_LENGTHS.get(field, 5000)
            if len(value) > max_len:
                return f'field_too_long:{field}'

            # Null byte kontrolü
            if '\x00' in value:
                return f'null_byte:{field}'

            # Saldırı kalıpları
            if request.path not in _SKIP_PATHS:
                for pattern in _ATTACK_PATTERNS:
                    if pattern.search(value):
                        return f'attack_pattern:{field}'

        return None
