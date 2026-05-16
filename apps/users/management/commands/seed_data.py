"""
Django management command to seed the database with sample mentor and student profiles.
Usage: python manage.py seed_data
"""
import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.mentors.models import MentorProfile, MentorTag
from apps.students.models import StudentProfile
from apps.reviews.models import Review

User = get_user_model()

MENTORS = [
    {
        'username': 'ahmet_yilmaz',
        'first_name': 'Ahmet',
        'last_name': 'Yılmaz',
        'email': 'ahmet.yilmaz@example.com',
        'bio': 'Yazılım mühendisi olarak 8 yıldır Python ve Django ile büyük ölçekli projeler geliştiriyorum. Temiz kod yazmaya ve junior geliştiricileri mentorlamaya tutkuluyum.',
        'years_experience': 8,
        'is_verified': True,
        'linkedin_url': 'https://linkedin.com/in/ahmet-yilmaz',
        'tags': ['python', 'django', 'backend', 'postgresql', 'rest-api'],
    },
    {
        'username': 'fatma_kaya',
        'first_name': 'Fatma',
        'last_name': 'Kaya',
        'email': 'fatma.kaya@example.com',
        'bio': 'Veri bilimi ve makine öğrenimi alanında 5 yıllık deneyimim var. Kaggle Master unvanına sahibim ve pek çok projede ML modelleri geliştirdim.',
        'years_experience': 5,
        'is_verified': True,
        'linkedin_url': 'https://linkedin.com/in/fatma-kaya',
        'tags': ['python', 'machine-learning', 'data-science', 'pandas', 'tensorflow'],
    },
    {
        'username': 'mehmet_demir',
        'first_name': 'Mehmet',
        'last_name': 'Demir',
        'email': 'mehmet.demir@example.com',
        'bio': 'React ve TypeScript konusunda uzman frontend geliştiriciyim. Kullanıcı deneyimine odaklanan modern web uygulamaları oluşturuyorum.',
        'years_experience': 6,
        'is_verified': True,
        'linkedin_url': '',
        'tags': ['react', 'typescript', 'frontend', 'css', 'nextjs'],
    },
    {
        'username': 'ayse_celik',
        'first_name': 'Ayşe',
        'last_name': 'Çelik',
        'email': 'ayse.celik@example.com',
        'bio': 'Ürün yönetimi alanında 10 yıllık deneyimimle startup ve kurumsal şirketlerde ürün stratejileri belirledim. Agile ve Scrum metodolojileri konusunda sertifikalıyım.',
        'years_experience': 10,
        'is_verified': True,
        'linkedin_url': 'https://linkedin.com/in/ayse-celik',
        'tags': ['product-management', 'agile', 'scrum', 'startup', 'strategy'],
    },
    {
        'username': 'mustafa_sahin',
        'first_name': 'Mustafa',
        'last_name': 'Şahin',
        'email': 'mustafa.sahin@example.com',
        'bio': 'DevOps mühendisi olarak Docker, Kubernetes ve CI/CD pipeline kurulumunda 7 yıl deneyimim var. Cloud altyapıları konusunda AWS sertifikasına sahibim.',
        'years_experience': 7,
        'is_verified': True,
        'linkedin_url': '',
        'tags': ['devops', 'docker', 'kubernetes', 'aws', 'cicd'],
    },
    {
        'username': 'zeynep_arslan',
        'first_name': 'Zeynep',
        'last_name': 'Arslan',
        'email': 'zeynep.arslan@example.com',
        'bio': 'UX/UI tasarım alanında 4 yıllık deneyimle kullanıcı odaklı dijital ürünler tasarlıyorum. Figma ve design system konularında uzmanım.',
        'years_experience': 4,
        'is_verified': True,
        'linkedin_url': 'https://linkedin.com/in/zeynep-arslan',
        'tags': ['ux', 'ui', 'figma', 'design-system', 'prototyping'],
    },
    {
        'username': 'can_ozturk',
        'first_name': 'Can',
        'last_name': 'Öztürk',
        'email': 'can.ozturk@example.com',
        'bio': "React Native ve Flutter ile çapraz platform mobil uygulama geliştiricisiyim. App Store ve Google Play'de yayında 12+ uygulamamız var.",
        'years_experience': 5,
        'is_verified': False,
        'linkedin_url': '',
        'tags': ['react-native', 'flutter', 'mobile', 'ios', 'android'],
    },
    {
        'username': 'selin_yildiz',
        'first_name': 'Selin',
        'last_name': 'Yıldız',
        'email': 'selin.yildiz@example.com',
        'bio': 'Java ve Spring Boot ile kurumsal düzeyde backend sistemler geliştiriyorum. Mikro servis mimarisi ve event-driven sistemler konusunda 9 yıl deneyimim var.',
        'years_experience': 9,
        'is_verified': True,
        'linkedin_url': 'https://linkedin.com/in/selin-yildiz',
        'tags': ['java', 'spring-boot', 'microservices', 'kafka', 'backend'],
    },
    {
        'username': 'emre_aydin',
        'first_name': 'Emre',
        'last_name': 'Aydın',
        'email': 'emre.aydin@example.com',
        'bio': 'Siber güvenlik uzmanıyım. Penetrasyon testleri, güvenlik denetimleri ve CTF yarışmalarından elde ettiğim 6 yıllık deneyimi kariyer rehberliği olarak paylaşıyorum.',
        'years_experience': 6,
        'is_verified': True,
        'linkedin_url': '',
        'tags': ['cybersecurity', 'pentesting', 'ethical-hacking', 'ctf', 'networking'],
    },
    {
        'username': 'leyla_gunes',
        'first_name': 'Leyla',
        'last_name': 'Güneş',
        'email': 'leyla.gunes@example.com',
        'bio': 'Yapay zeka ve doğal dil işleme alanında araştırmacı ve mühendisim. Türkçe NLP modelleri geliştirme konusunda akademik yayınlarım bulunuyor.',
        'years_experience': 3,
        'is_verified': False,
        'linkedin_url': 'https://linkedin.com/in/leyla-gunes',
        'tags': ['nlp', 'ai', 'deep-learning', 'pytorch', 'transformers'],
    },
    {
        'username': 'burak_koc',
        'first_name': 'Burak',
        'last_name': 'Koç',
        'email': 'burak.koc@example.com',
        'bio': 'Node.js ve Vue.js ile full-stack uygulamalar geliştiriyorum. SaaS ürünleri kurmak ve ölçeklendirmek konusunda 7 yıl deneyimim var.',
        'years_experience': 7,
        'is_verified': True,
        'linkedin_url': '',
        'tags': ['nodejs', 'vuejs', 'fullstack', 'mongodb', 'graphql'],
    },
    {
        'username': 'ceren_polat',
        'first_name': 'Ceren',
        'last_name': 'Polat',
        'email': 'ceren.polat@example.com',
        'bio': 'Veri analizi ve iş zekası konusunda 5 yıllık deneyimimle SQL, Power BI ve Tableau ile iş kararlarını destekleyen analizler üretiyorum.',
        'years_experience': 5,
        'is_verified': True,
        'linkedin_url': 'https://linkedin.com/in/ceren-polat',
        'tags': ['sql', 'power-bi', 'tableau', 'data-analysis', 'excel'],
    },
]

STUDENTS = [
    {
        'username': 'elif_ercan',
        'first_name': 'Elif',
        'last_name': 'Ercan',
        'email': 'elif.ercan@example.com',
        'bio': 'Bilgisayar mühendisliği öğrencisiyim. Backend geliştirme ve veri bilimine ilgi duyuyorum.',
        'interests': 'backend, python, data science',
    },
    {
        'username': 'kaan_dogan',
        'first_name': 'Kaan',
        'last_name': 'Doğan',
        'email': 'kaan.dogan@example.com',
        'bio': 'Yazılım geliştirici adayıyım, frontend ve mobil uygulama geliştirme üzerine odaklanıyorum.',
        'interests': 'react, mobile, ui',
    },
    {
        'username': 'busra_aktas',
        'first_name': 'Büşra',
        'last_name': 'Aktaş',
        'email': 'busra.aktas@example.com',
        'bio': 'Kariyer değişikliği yaparak yazılıma geçmek istiyorum. UX tasarım ve frontend öğrenmek istiyorum.',
        'interests': 'ux, frontend, design',
    },
    {
        'username': 'oguzhan_cetin',
        'first_name': 'Oğuzhan',
        'last_name': 'Çetin',
        'email': 'oguzhan.cetin@example.com',
        'bio': 'DevOps ve bulut teknolojileri öğrenmek istiyorum. Siber güvenlik alanında kariyer hedefliyorum.',
        'interests': 'devops, cloud, security',
    },
    {
        'username': 'ilayda_kara',
        'first_name': 'İlayda',
        'last_name': 'Kara',
        'email': 'ilayda.kara@example.com',
        'bio': 'Veri bilimi ve yapay zeka alanında kariyer kurmak istiyorum. Python bilen birisiyim.',
        'interests': 'data science, ai, ml',
    },
    {
        'username': 'alp_yuksel',
        'first_name': 'Alp',
        'last_name': 'Yüksel',
        'email': 'alp.yuksel@example.com',
        'bio': 'Yazılım geliştirme alanında yeni başlayanlar için mentor arıyorum. Full-stack developer olmak istiyorum.',
        'interests': 'fullstack, nodejs, react',
    },
    {
        'username': 'deniz_ozdemir',
        'first_name': 'Deniz',
        'last_name': 'Özdemir',
        'email': 'deniz.ozdemir@example.com',
        'bio': 'Ürün yöneticisi olmak istiyorum. Teknoloji şirketlerinde kariyer hedefliyorum.',
        'interests': 'product management, startup, agile',
    },
    {
        'username': 'gulsen_turan',
        'first_name': 'Gülşen',
        'last_name': 'Turan',
        'email': 'gulsen.turan@example.com',
        'bio': 'Java ve Spring Boot öğrenmek istiyorum. Fintech alanında kariyer kurmak istiyorum.',
        'interests': 'java, backend, fintech',
    },
]

REVIEW_COMMENTS = [
    'Çok yardımcı bir mentor! Sorularımı sabır ve netlikle yanıtladı.',
    'Deneyimi ve bilgisi ile kariyer yolumda çok büyük katkı sağladı.',
    'Gerçekten pratik öneriler sunuyor. Kesinlikle tavsiye ederim!',
    'Anlatım tarzı çok iyiydi, konuları kolayca kavradım.',
    'Mesleki deneyimini bol bol paylaşıyor. Çok değerli bir mentor.',
    'Sabır ve özeniyle anlatımı sayesinde hızla ilerliyorum.',
    'Gerçek projelerdeki tecrübelerini aktarıyor. Çok faydalıydı.',
    'Sorularıma hep zamanında geri döndü. Teşekkürler!',
]


class Command(BaseCommand):
    help = 'Seed the database with sample mentor and student profiles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing seed data before creating new ones',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing seed data...')
            usernames = [m['username'] for m in MENTORS] + [s['username'] for s in STUDENTS]
            User.objects.filter(username__in=usernames).delete()
            self.stdout.write(self.style.WARNING('Cleared.'))

        # Create mentors
        created_mentors = []
        for data in MENTORS:
            if User.objects.filter(username=data['username']).exists():
                self.stdout.write(f"  Skipping existing user: {data['username']}")
                try:
                    profile = MentorProfile.objects.get(user__username=data['username'])
                    created_mentors.append(profile)
                except MentorProfile.DoesNotExist:
                    pass
                continue

            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                password='mentor1234',
                role='mentor',
                is_email_verified=True,
            )
            profile = MentorProfile.objects.create(
                user=user,
                bio=data['bio'],
                years_experience=data['years_experience'],
                is_verified=data['is_verified'],
                linkedin_url=data.get('linkedin_url', ''),
            )
            for tag_name in data['tags']:
                MentorTag.objects.get_or_create(mentor=profile, name=tag_name)
            created_mentors.append(profile)
            self.stdout.write(self.style.SUCCESS(f'  Created mentor: {user.get_full_name()}'))

        # Create students
        created_students = []
        for data in STUDENTS:
            if User.objects.filter(username=data['username']).exists():
                self.stdout.write(f"  Skipping existing user: {data['username']}")
                try:
                    created_students.append(User.objects.get(username=data['username']))
                except User.DoesNotExist:
                    pass
                continue

            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                password='student1234',
                role='student',
                is_email_verified=True,
            )
            StudentProfile.objects.create(
                user=user,
                bio=data['bio'],
                interests=data['interests'],
            )
            created_students.append(user)
            self.stdout.write(self.style.SUCCESS(f'  Created student: {user.get_full_name()}'))

        # Create reviews: each student reviews 3-6 random mentors
        review_count = 0
        for student in created_students:
            sample_mentors = random.sample(created_mentors, min(random.randint(3, 6), len(created_mentors)))
            for mentor_profile in sample_mentors:
                if Review.objects.filter(mentor=mentor_profile, student=student).exists():
                    continue
                Review.objects.create(
                    mentor=mentor_profile,
                    student=student,
                    rating=random.randint(3, 5),
                    comment=random.choice(REVIEW_COMMENTS),
                )
                review_count += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Seed completed: {len(created_mentors)} mentors, {len(created_students)} students, {review_count} reviews created.'
        ))
        self.stdout.write('')
        self.stdout.write('Default passwords:')
        self.stdout.write('  Mentors  : mentor1234')
        self.stdout.write('  Students : student1234')
