import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.mentors.models import MentorProfile

User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user_a(db):
    return User.objects.create_user(
        username='kullanici_a', password='Test1234!',
        role='student', email='a@test.com'
    )


@pytest.fixture
def user_b(db):
    return User.objects.create_user(
        username='kullanici_b', password='Test1234!',
        role='mentor', email='b@test.com'
    )


@pytest.fixture
def mentor_profile(db, user_b):
    return MentorProfile.objects.create(
        user=user_b, bio='test mentor', years_experience=3
    )


@pytest.fixture
def token_a(client, user_a):
    res = client.post(reverse('login'), {'username': 'kullanici_a', 'password': 'Test1234!'})
    return res.data['access']


@pytest.fixture
def token_b(client, user_b):
    res = client.post(reverse('login'), {'username': 'kullanici_b', 'password': 'Test1234!'})
    return res.data['access']


# ── Mesajlaşma testleri ───────────────────────────────────────────────────────

@pytest.mark.django_db
class TestMessaging:
    def test_giris_yapmadan_mesaj_gonderilmez(self, client, user_b):
        res = client.post(reverse('message-list'), {
            'receiver': user_b.id,
            'content': 'Merhaba'
        })
        assert res.status_code == 401

    def test_mesaj_gonderme(self, client, user_a, user_b, token_a):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_a)
        res = client.post(reverse('message-list'), {
            'receiver': user_b.id,
            'content': 'Merhaba hocam!'
        }, format='json')
        assert res.status_code == 201
        assert res.data['content'] == 'Merhaba hocam!'
        assert res.data['sender_username'] == 'kullanici_a'

    def test_mesaj_listesi(self, client, user_a, user_b, token_a):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_a)
        client.post(reverse('message-list'), {'receiver': user_b.id, 'content': 'Mesaj 1'}, format='json')
        client.post(reverse('message-list'), {'receiver': user_b.id, 'content': 'Mesaj 2'}, format='json')
        res = client.get(reverse('message-list'))
        assert res.status_code == 200
        data = res.data.get('results', res.data)
        assert len(data) >= 2

    def test_iki_kullanici_arasi_mesajlar(self, client, user_a, user_b, token_a):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_a)
        client.post(reverse('message-list'), {'receiver': user_b.id, 'content': 'Selam'}, format='json')
        res = client.get(reverse('message-list'), {'with': user_b.id})
        assert res.status_code == 200
        data = res.data.get('results', res.data)
        assert len(data) >= 1

    def test_bos_mesaj_gonderilemez(self, client, user_a, user_b, token_a):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_a)
        res = client.post(reverse('message-list'), {
            'receiver': user_b.id,
            'content': ''
        }, format='json')
        assert res.status_code == 400


# ── Review testleri ───────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestReview:
    def test_yorumlar_herkese_acik(self, client, mentor_profile):
        res = client.get(reverse('review-list'))
        assert res.status_code == 200

    def test_giris_yapmadan_yorum_yapilamaz(self, client, mentor_profile):
        res = client.post(reverse('review-list'), {
            'mentor': mentor_profile.id,
            'rating': 5,
            'comment': 'Harika'
        }, format='json')
        assert res.status_code == 401

    def test_yorum_ekleme(self, client, user_a, mentor_profile, token_a):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_a)
        res = client.post(reverse('review-list'), {
            'mentor': mentor_profile.id,
            'rating': 4,
            'comment': 'Cok iyi bir mentor'
        }, format='json')
        assert res.status_code == 201
        assert res.data['rating'] == 4
        assert res.data['student_username'] == 'kullanici_a'

    def test_gecersiz_puan_reddedilir(self, client, user_a, mentor_profile, token_a):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_a)
        res = client.post(reverse('review-list'), {
            'mentor': mentor_profile.id,
            'rating': 6,
            'comment': 'test'
        }, format='json')
        assert res.status_code == 400

    def test_ayni_mentora_iki_yorum_yapilamaz(self, client, user_a, mentor_profile, token_a):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_a)
        client.post(reverse('review-list'), {
            'mentor': mentor_profile.id, 'rating': 5, 'comment': 'ilk yorum'
        }, format='json')
        res = client.post(reverse('review-list'), {
            'mentor': mentor_profile.id, 'rating': 3, 'comment': 'ikinci yorum'
        }, format='json')
        assert res.status_code == 400

    def test_mentor_filtreleme(self, client, user_a, mentor_profile, token_a):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_a)
        client.post(reverse('review-list'), {
            'mentor': mentor_profile.id, 'rating': 5, 'comment': 'harika'
        }, format='json')
        client.credentials()
        res = client.get(reverse('review-list'), {'mentor': mentor_profile.id})
        data = res.data.get('results', res.data)
        assert len(data) >= 1

    def test_ortalama_puan_guncellenir(self, client, user_a, mentor_profile, token_a):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + token_a)
        client.post(reverse('review-list'), {
            'mentor': mentor_profile.id, 'rating': 4, 'comment': 'iyi'
        }, format='json')
        mentor_profile.refresh_from_db()
        assert mentor_profile.avg_rating == 4.0
