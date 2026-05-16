import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.mentors.models import MentorProfile, MentorTag

User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def mentor_user(db):
    return User.objects.create_user(
        username='mentor1', password='Test1234!', role='mentor',
        first_name='Ali', last_name='Yilmaz', email='ali@test.com'
    )


@pytest.fixture
def student_user(db):
    return User.objects.create_user(
        username='ogrenci1', password='Test1234!', role='student',
        email='ogrenci@test.com'
    )


@pytest.fixture
def mentor_profile(db, mentor_user):
    profile = MentorProfile.objects.create(
        user=mentor_user,
        bio='Python ve Django uzmani',
        years_experience=5,
        is_verified=True,
        avg_rating=4.5,
    )
    MentorTag.objects.create(mentor=profile, name='python')
    MentorTag.objects.create(mentor=profile, name='django')
    return profile


@pytest.fixture
def mentor_token(client, mentor_user):
    res = client.post(reverse('login'), {'username': 'mentor1', 'password': 'Test1234!'})
    return res.data['access']


@pytest.fixture
def student_token(client, student_user):
    res = client.post(reverse('login'), {'username': 'ogrenci1', 'password': 'Test1234!'})
    return res.data['access']


# ── Mentor listeleme testleri ─────────────────────────────────────────────────

@pytest.mark.django_db
class TestMentorList:
    def test_mentor_listesi_herkese_acik(self, client, mentor_profile):
        res = client.get(reverse('mentor-list'))
        assert res.status_code == 200

    def test_mentor_listesi_sonuc_donuyor(self, client, mentor_profile):
        res = client.get(reverse('mentor-list'))
        data = res.data.get('results', res.data)
        assert len(data) >= 1

    def test_tag_ile_filtreleme(self, client, mentor_profile):
        res = client.get(reverse('mentor-list'), {'tag': 'python'})
        data = res.data.get('results', res.data)
        assert len(data) >= 1

    def test_olmayan_tag_ile_filtreleme(self, client, mentor_profile):
        res = client.get(reverse('mentor-list'), {'tag': 'hicbir_sey_yok'})
        data = res.data.get('results', res.data)
        assert len(data) == 0

    def test_min_rating_filtresi(self, client, mentor_profile):
        res = client.get(reverse('mentor-list'), {'min_rating': '4.0'})
        data = res.data.get('results', res.data)
        assert len(data) >= 1

    def test_yuksek_min_rating_filtresi(self, client, mentor_profile):
        res = client.get(reverse('mentor-list'), {'min_rating': '5.0'})
        data = res.data.get('results', res.data)
        assert len(data) == 0


# ── Mentor profil oluşturma testleri ─────────────────────────────────────────

@pytest.mark.django_db
class TestMentorCreate:
    def test_giris_yapmadan_profil_olusturulamaz(self, client):
        res = client.post(reverse('mentor-create'), {'bio': 'test'})
        assert res.status_code == 401

    def test_mentor_profil_olusturma(self, client, mentor_user, mentor_token):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + mentor_token)
        res = client.post(reverse('mentor-create'), {
            'bio': 'Ben bir mentor',
            'years_experience': 3,
            'tag_names': ['python', 'flask'],
        }, format='json')
        assert res.status_code == 201
        assert res.data['bio'] == 'Ben bir mentor'
        assert len(res.data['tags']) == 2

    def test_profil_taglarla_olusturulur(self, client, mentor_user, mentor_token):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + mentor_token)
        res = client.post(reverse('mentor-create'), {
            'bio': 'test',
            'years_experience': 2,
            'tag_names': ['javascript', 'react'],
        }, format='json')
        assert res.status_code == 201
        tag_names = [t['name'] for t in res.data['tags']]
        assert 'javascript' in tag_names
        assert 'react' in tag_names


# ── Mentor detay testleri ─────────────────────────────────────────────────────

@pytest.mark.django_db
class TestMentorDetail:
    def test_mentor_detayi_goruntulenir(self, client, mentor_profile):
        res = client.get(reverse('mentor-detail', kwargs={'pk': mentor_profile.pk}))
        assert res.status_code == 200
        assert res.data['username'] == 'mentor1'

    def test_mentor_kendi_profilini_guncelleyebilir(self, client, mentor_profile, mentor_token):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + mentor_token)
        res = client.patch(
            reverse('mentor-detail', kwargs={'pk': mentor_profile.pk}),
            {'bio': 'Guncellendi', 'years_experience': 7},
            format='json'
        )
        assert res.status_code == 200
        assert res.data['bio'] == 'Guncellendi'

    def test_baska_kullanici_profil_guncelleyemez(self, client, mentor_profile, student_token):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + student_token)
        res = client.patch(
            reverse('mentor-detail', kwargs={'pk': mentor_profile.pk}),
            {'bio': 'Izinsiz guncelleme'},
            format='json'
        )
        assert res.status_code == 403
