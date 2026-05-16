#!/bin/bash
# Mentonnect — uygulama klasörlerini oluştur

APPS="users mentors students messaging reviews verification"

for app in $APPS; do
    mkdir -p apps/$app
    touch apps/$app/__init__.py
    touch apps/$app/models.py
    touch apps/$app/serializers.py
    touch apps/$app/views.py
    touch apps/$app/urls.py
    touch apps/$app/admin.py
    touch apps/$app/apps.py
    # apps.py içeriğini yaz
    echo "from django.apps import AppConfig

class $(echo ${app^})Config(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.$app'
" > apps/$app/apps.py
done

touch apps/__init__.py

echo "✅ Tüm uygulama klasörleri oluşturuldu."
echo ""
echo "Klasör yapısı:"
find apps -type f -name "*.py" | sort
