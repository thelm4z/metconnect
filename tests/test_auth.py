import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def student_data():
    return {
        'username': 'test_ogrenci',
        'email': 'ogrenci@test.com',
        'password': 'Test1234!',
        'role': 'student',
        'first_name': 'Test',
        'last_name': 'Ogrenci',
    }


@pytest.fixture
def mentor_data():
    return {
        'username': 'test_mentor',
        'email': 'mentor@test.com',
        'password': 'Test1234!',
        'role': 'mentor',
        'first_name': 'Test',
        'last_name': 'Mentor',
    }


@pytest.fixture
def registered_student(db, student_data):
    user = User.objects.create_user(
        username=student_data['username'],
        email=student_data['email'],
        password=student_data['password'],
        role='student',
        first_name=student_data['first_name'],
        last_name=student_data['last_name'],
    )
    return user


@pytest.fixture
def registered_mentor(db, mentor_data):
    user = User.objects.create_user(
        username=mentor_data['username'],
        email=mentor_data['email'],
        password=mentor_data['password'],
        role='mentor',
        first_name=mentor_data['first_name'],
        last_name=mentor_data['last_name'],
    )
    return user


@pytest.fixture
def student_token(client, registered_student):
    res = client.post(reverse('login'), {
        'username': registered_student.username,
        'password': 'Test1234!',
    })
    return res.data['access']


@pytest.fixture
def mentor_token(client, registered_mentor):
    res = client.post(reverse('login'), {
        'username': registered_mentor.username,
        'password': 'Test1234!',
    })
    return res.data['access']


# ── Kayıt testleri ────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRegister:
    def test_ogrenci_kayit_basarili(self, client, student_data):
        res = client.post(reverse('register'), student_data)
        assert res.status_code == 201
        assert res.data['username'] == student_data['username']
        assert res.data['role'] == 'student'
        assert 'password' not in res.data

    def test_mentor_kayit_basarili(self, client, mentor_data):
        res = client.post(reverse('register'), mentor_data)
        assert res.status_code == 201
        assert res.data['role'] == 'mentor'

    def test_ayni_kullanici_adi_tekrar_kayit(self, client, student_data, registered_student):
        res = client.post(reverse('register'), student_data)
        assert res.status_code == 400

    def test_sifre_olmadan_kayit(self, client, student_data):
        student_data.pop('password')
        res = client.post(reverse('register'), student_data)
        assert res.status_code == 400

    def test_kisa_sifre_reddedilir(self, client, student_data):
        student_data['password'] = '123'
        res = client.post(reverse('register'), student_data)
        assert res.status_code == 400


# ── Giriş testleri ────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestLogin:
    def test_dogru_bilgiyle_giris(self, client, registered_student):
        res = client.post(reverse('login'), {
            'username': registered_student.username,
            'password': 'Test1234!',
        })
        assert res.status_code == 200
        assert 'access' in res.data
        assert 'refresh' in res.data

    def test_yanlis_sifre_ile_giris(self, client, registered_student):
        res = client.post(reverse('login'), {
            'username': registered_student.username,
            'password': 'yanlis_sifre',
        })
        assert res.status_code == 401

    def test_olmayan_kullanici_girisi(self, client):
        res = client.post(reverse('login'), {
            'username': 'yok_boyle_biri',
            'password': 'Test1234!',
        })
        assert res.status_code == 401

    def test_token_yenileme(self, client, registered_student):
        login_res = client.post(reverse('login'), {
            'username': registered_student.username,
            'password': 'Test1234!',
        })
        refresh = login_res.data['refresh']
        res = client.post(reverse('token_refresh'), {'refresh': refresh})
        assert res.status_code == 200
        assert 'access' in res.data


# ── Me endpoint testleri ──────────────────────────────────────────────────────

@pytest.mark.django_db
class TestMe:
    def test_giris_yapmadan_me_endpointi(self, client):
        res = client.get(reverse('me'))
        assert res.status_code == 401

    def test_giris_yapinca_me_endpointi(self, client, registered_student, student_token):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + student_token)
        res = client.get(reverse('me'))
        assert res.status_code == 200
        assert res.data['username'] == registered_student.username
