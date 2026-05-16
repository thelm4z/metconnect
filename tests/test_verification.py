import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.mentors.models import MentorProfile
from apps.verification.models import Verification

User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def mentor_user(db):
    return User.objects.create_user(
        username='mentor_dogrulama', password='Test1234!',
        role='mentor', email='mentor@test.com'
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username='admin', password='Admin1234!',
        email='admin@test.com'
    )


@pytest.fixture
def mentor_profile(db, mentor_user):
    return MentorProfile.objects.create(
        user=mentor_user, bio='test', years_experience=2
    )


@pytest.fixture
def mentor_token(client, mentor_user):
    res = client.post(reverse('login'), {'username': 'mentor_dogrulama', 'password': 'Test1234!'})
    return res.data['access']


@pytest.fixture
def admin_token(client, admin_user):
    res = client.post(reverse('login'), {'username': 'admin', 'password': 'Admin1234!'})
    return res.data['access']


def make_cv():
    return SimpleUploadedFile('cv.pdf', b'PDF icerik', content_type='application/pdf')


@pytest.mark.django_db
class TestVerification:
    def test_giris_yapmadan_basvuru_yapilamaz(self, client):
        res = client.post(reverse('verification-apply'), {'cv_file': make_cv()})
        assert res.status_code == 401

    def test_mentor_basvuru_yapabilir(self, client, mentor_profile, mentor_token):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + mentor_token)
        res = client.post(reverse('verification-apply'), {
            'cv_file': make_cv(),
            'extra_note': 'Django uzmaniyim'
        }, format='multipart')
        assert res.status_code == 201
        assert res.data['status'] == 'pending'

    def test_admin_basvurulari_gorebilir(self, client, mentor_profile, mentor_token, admin_token):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + mentor_token)
        client.post(reverse('verification-apply'), {'cv_file': make_cv()}, format='multipart')
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + admin_token)
        res = client.get(reverse('verification-list'))
        assert res.status_code == 200
        data = res.data.get('results', res.data)
        assert len(data) >= 1

    def test_normal_kullanici_liste_goremez(self, client, mentor_token):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + mentor_token)
        res = client.get(reverse('verification-list'))
        assert res.status_code == 403

    def test_admin_basvuruyu_onaylayabilir(self, client, mentor_profile, mentor_token, admin_token):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + mentor_token)
        apply_res = client.post(reverse('verification-apply'), {'cv_file': make_cv()}, format='multipart')
        v_id = apply_res.data['id']
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + admin_token)
        res = client.patch(
            reverse('verification-review', kwargs={'pk': v_id}),
            {'action': 'approve', 'admin_note': 'Uygun bulundu'},
            format='json'
        )
        assert res.status_code == 200
        assert res.data['status'] == 'approved'
        mentor_profile.refresh_from_db()
        assert mentor_profile.is_verified == True

    def test_admin_basvuruyu_reddedebilir(self, client, mentor_profile, mentor_token, admin_token):
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + mentor_token)
        apply_res = client.post(reverse('verification-apply'), {'cv_file': make_cv()}, format='multipart')
        v_id = apply_res.data['id']
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + admin_token)
        res = client.patch(
            reverse('verification-review', kwargs={'pk': v_id}),
            {'action': 'reject', 'admin_note': 'Eksik belge'},
            format='json'
        )
        assert res.status_code == 200
        assert res.data['status'] == 'rejected'
        mentor_profile.refresh_from_db()
        assert mentor_profile.is_verified == False
