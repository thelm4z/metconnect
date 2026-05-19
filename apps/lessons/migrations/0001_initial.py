from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='LessonSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200, verbose_name='Başlık')),
                ('room_code', models.CharField(max_length=12, unique=True, verbose_name='Oda Kodu')),
                ('status', models.CharField(
                    choices=[('waiting', 'Bekliyor'), ('active', 'Aktif'), ('ended', 'Tamamlandı')],
                    default='waiting', max_length=10,
                )),
                ('shared_notes', models.TextField(blank=True, verbose_name='Paylaşımlı Notlar')),
                ('shared_code', models.TextField(blank=True, verbose_name='Paylaşımlı Kod')),
                ('code_language', models.CharField(
                    choices=[
                        ('python', 'Python'), ('javascript', 'JavaScript'),
                        ('java', 'Java'), ('cpp', 'C++'), ('html', 'HTML/CSS'),
                        ('sql', 'SQL'), ('typescript', 'TypeScript'), ('other', 'Diğer'),
                    ],
                    default='python', max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('ended_at', models.DateTimeField(blank=True, null=True)),
                ('mentor', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='mentor_sessions',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Mentor',
                )),
                ('student', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='student_sessions',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Öğrenci',
                )),
            ],
            options={
                'verbose_name': 'Ders Oturumu',
                'verbose_name_plural': 'Ders Oturumları',
                'ordering': ['-created_at'],
            },
        ),
    ]
