from django.urls import path
from .views import LoginView

urlpatterns = [
    # Quando a requisição chegar aqui, ela acionará a nossa LoginView
    # Usamos .as_view() porque LoginView é uma Classe, e o roteador do Django espera uma Função.
    path('login/', LoginView.as_view(), name='api_login'),
]