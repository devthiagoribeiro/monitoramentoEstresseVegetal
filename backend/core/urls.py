from django.contrib import admin
from django.urls import path, include # <-- Importamos o 'include'

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Todas as URLs que começarem com 'api/auth/' serão repassadas para o arquivo users/urls.py
    path('api/auth/', include('users.urls')), 
]