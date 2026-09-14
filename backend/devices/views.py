from rest_framework import viewsets, permissions, response, status
from .models import Farm, Sensor, Reading, AuthorizedDevice
from .serializers import FarmSerializer, SensorSerializer, ReadingSerializer

class FarmViewSet(viewsets.ModelViewSet):
    queryset = Farm.objects.all()
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Amarra automaticamente a fazenda ao usuário logado na sessão
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        # Filtra as fazendas para mostrar apenas as do usuário logado
        return Farm.objects.filter(manager=self.request.user)

    def perform_create(self, serializer):
        # Ao criar uma fazenda, injeta o usuário logado como 'manager'
        serializer.save(manager=self.request.user)\
        
    def destroy(self, request, *args, **kwargs):
        farm = self.get_object()

        if farm.manager != request.user:
            return response(
                {"detail": "You are not the owner of this farm."},
                status=status.HTTP_403_FORBIDDEN
            )

        farm.delete()

        return response(status=status.HTTP_204_NO_CONTENT)

class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        # O pk vem dentro de kwargs ou podemos usar o método get_object() padrão do DRF
        sensor = self.get_object()
        mac = sensor.mac_address

        # 1. Libera o sensor no estoque da fábrica para ficar disponível novamente
        AuthorizedDevice.objects.filter(mac_address=mac).update(is_used=False)

        # 2. Deleta o sensor da fazenda atual (o histórico permanece salvo nas leituras carimbadas)
        sensor.delete()

        return response({"detail": "Sensor desacoplado com sucesso. Histórico preservado na fazenda."}, status=status.HTTP_204_NO_CONTENT)

class ReadingViewSet(viewsets.ModelViewSet):
    serializer_class = ReadingSerializer

    def get_queryset(self):
        return Reading.objects.filter(sensor__farm__manager=self.request.user)