from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FarmViewSet, SensorViewSet, ReadingViewSet

# Instanciamos o roteador automático do DRF
router = DefaultRouter()

# Registramos nossos ViewSets no roteador
router.register(r'farms', FarmViewSet, basename='farm')
router.register(r'sensors', SensorViewSet, basename='sensor')
router.register(r'readings', ReadingViewSet, basename='reading')

urlpatterns = [
    # O router.urls contém todas as rotas (GET, POST, PUT, DELETE) geradas automaticamente
    path('', include(router.urls)),
]