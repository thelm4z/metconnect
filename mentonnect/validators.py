"""
Mentonnect — Ortak Güvenlik Validatörleri
"""
import re
import bleach
from rest_framework import serializers

# ── XSS / Script içerik temizleme ────────────────────────────────────────────

# İzin verilen HTML etiketleri (yorum/bio için minimal set)
_ALLOWED_TAGS: list[str] = []   # Hiç HTML etiketi kabul etme
_ALLOWED_ATTRS: dict = {}

def strip_html(value: str) -> str:
    """HTML tag'lerini ve zararlı içeriği temizler."""
    return bleach.clean(value, tags=_ALLOWED_TAGS, attributes=_ALLOWED_ATTRS, strip=True)

# ── Zararlı pattern kontrolü ──────────────────────────────────────────────────

_XSS_PATTERNS = [
    re.compile(r'<\s*script', re.I),
    re.compile(r'javascript\s*:', re.I),
    re.compile(r'on\w{2,20}\s*=', re.I),
    re.compile(r'<\s*(iframe|object|embed|svg)', re.I),
    re.compile(r'vbscript\s*:|expression\s*\(', re.I),
    re.compile(r'data\s*:\s*text/(html|javascript)', re.I),
]

_SQL_PATTERNS = [
    re.compile(r"'\s*(or|and)\s*'", re.I),
    re.compile(r'union\s+(all\s+)?select\s', re.I),
    re.compile(r';\s*(drop|delete|truncate|alter|insert|update)\s', re.I),
    re.compile(r'(sleep|benchmark|waitfor\s+delay)\s*\(', re.I),
    re.compile(r'information_schema|sysobjects', re.I),
]

def check_malicious(value: str, field_name: str = 'alan') -> None:
    """Zararlı içerik varsa ValidationError fırlatır."""
    for pattern in _XSS_PATTERNS + _SQL_PATTERNS:
        if pattern.search(value):
            raise serializers.ValidationError(
                f'{field_name} alanında geçersiz içerik tespit edildi.'
            )

# ── Yeniden kullanılabilir field validatörleri ────────────────────────────────

def validate_safe_text(value: str, max_length: int = 2000, field_name: str = 'Alan') -> str:
    """Metin alanlarını temizler ve güvenlik kontrolü yapar."""
    if not isinstance(value, str):
        return value
    stripped = value.strip()
    # Önce orijinal değerde zararlı pattern kontrolü yap
    check_malicious(stripped, field_name)
    # Sonra HTML tag'lerini temizle
    cleaned = strip_html(stripped)
    if len(cleaned) > max_length:
        raise serializers.ValidationError(
            f'{field_name} en fazla {max_length} karakter olabilir.'
        )
    return cleaned

def validate_username(value: str) -> str:
    """Kullanıcı adı: sadece harf, rakam, _, - """
    if not re.match(r'^[\w.-]{3,150}$', value):
        raise serializers.ValidationError(
            'Kullanıcı adı yalnızca harf, rakam, alt çizgi ve tire içerebilir (3-150 karakter).'
        )
    # Yaygın bot/injection isimleri
    blocked = {'admin', 'root', 'system', 'superuser', 'moderator'}
    if value.lower() in blocked:
        raise serializers.ValidationError('Bu kullanıcı adı kullanılamaz.')
    return value

def validate_url(value: str) -> str:
    """URL güvenli mi kontrol eder."""
    if not value:
        return value
    if not re.match(r'^https?://', value, re.I):
        raise serializers.ValidationError('URL http:// veya https:// ile başlamalıdır.')
    if len(value) > 500:
        raise serializers.ValidationError('URL en fazla 500 karakter olabilir.')
    dangerous = ['javascript:', 'vbscript:', 'data:']
    for d in dangerous:
        if d in value.lower():
            raise serializers.ValidationError('Geçersiz URL.')
    return value
