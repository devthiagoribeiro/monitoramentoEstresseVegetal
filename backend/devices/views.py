from rest_framework import viewsets
from .models import Farm, Sensor, Reading
from .serializers import FarmSerializer, SensorSerializer, ReadingSerializer

class FarmViewSet(viewsets.ModelViewSet):
    serializer_class = FarmSerializer

    def get_queryset(self):
        # Filtra as fazendas para mostrar apenas as do usuário logado
        return Farm.objects.filter(manager=self.request.user)

    def perform_create(self, serializer):
        # Ao criar uma fazenda, injeta o usuário logado como 'manager'
        serializer.save(manager=self.request.user)

class SensorViewSet(viewsets.ModelViewSet):
    serializer_class = SensorSerializer

    def get_queryset(self):
        return Sensor.objects.filter(farm__manager=self.request.user)

class ReadingViewSet(viewsets.ModelViewSet):
    serializer_class = ReadingSerializer

    def get_queryset(self):
        return Reading.objects.filter(sensor__farm__manager=self.request.user)