from rest_framework import serializers
from .models import Farm, Sensor, Reading, AuthorizedDevice

class FarmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farm
        fields = '__all__' 
        read_only_fields = ['manager'] # O backend preenche isso automaticamente

class SensorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sensor
        fields = '__all__'
        extra_kwargs = {
            'mac_address': {'validators': []}
        }

    def validate(self, data):
        mac = data.get('mac_address')
        if not mac:
            return data

        # Verifica se existe no estoque da fábrica
        try:
            device = AuthorizedDevice.objects.get(mac_address=mac)
        except AuthorizedDevice.DoesNotExist:
            raise serializers.ValidationError({
                "mac_address": "Operação negada: Este sensor não existe na lista de dispositivos autorizados."
            })

        return data

    def create(self, validated_data):
        mac = validated_data.get('mac_address')
        farm = validated_data.get('farm')
        description = validated_data.get('description', '')

        device = AuthorizedDevice.objects.get(mac_address=mac)
        
        if not device.is_used:

            created = Sensor.objects.create(
                mac_address=mac,
                farm=farm,
                description=description
            )

            # Marca no estoque que agora está em uso
            device.is_used = True
            device.save()

            return created
        raise serializers.ValidationError({
                        "is_used": "Operação negada: Este sensor já está em uso por outra fazenda."
                    })
          
class ReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reading
        fields = '__all__'
        # Deixamos o campo farm como somente leitura no payload externo, 
        # pois o sistema vai preenchê-lo sozinho por segurança
        read_only_fields = ['farm'] 

    def create(self, validated_data):
        sensor = validated_data.get('sensor')
        
        # O Pulo do Gato: Descobrimos qual fazenda o sensor está ligado AGORA
        if sensor.farm:
            validated_data['farm'] = sensor.farm
            
        return super().create(validated_data)