from django.db import models
from django.conf import settings # Importamos as configurações para puxar o nosso modelo de Usuário

class Farm(models.Model):
    name = models.CharField(max_length=255, verbose_name='Nome da Fazenda')
    address = models.TextField(verbose_name='Endereço', blank=True, null=True)
    owner_name = models.CharField(max_length=255, verbose_name='Nome do Proprietário')
    contact_phone = models.CharField(max_length=20, verbose_name='Telefone de Contato', blank=True, null=True)
    contact_email = models.EmailField(verbose_name='E-mail de Contato', blank=True, null=True)
    
    # RELACIONAMENTO (1,N): Uma Fazenda tem 1 Responsável. Um Responsável pode ter N Fazendas.
    # on_delete=models.CASCADE significa que se o Usuário for apagado, as fazendas dele também serão.
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='farms', 
        verbose_name='Responsável'
    )

    def __str__(self):
        return self.name

class AuthorizedDevice(models.Model):
    """
    Lista de dispositivos (estoque) fabricados e autorizados pela empresa.
    """
    mac_address = models.CharField(max_length=50, unique=True, verbose_name="MAC Address / ID Físico")
    is_used = models.BooleanField(default=False, verbose_name="Já está em uso?")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.mac_address

class Sensor(models.Model):
    device = models.ForeignKey(
        AuthorizedDevice,
        on_delete=models.CASCADE,
        related_name='instalação',
        verbose_name='mac_address'
    )
    description = models.TextField(verbose_name='Descrição do dispositivo', blank=True, null=True)
    
    # RELACIONAMENTO (1,N): Um sensor pertence a 1 Fazenda.
    farm = models.ForeignKey(
        Farm, 
        on_delete=models.CASCADE, 
        related_name='sensors', 
        verbose_name='Fazenda'
    )
    
    is_active = models.BooleanField(default=True, verbose_name='Ativo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Data de Cadastro')

    def __str__(self):
        return f"Sensor {self.mac_address} ({self.farm.name})"


class Reading(models.Model):
    # Relacionamos a leitura ao sensor e TAMBÉM guardamos a fazenda onde ela ocorreu
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE, related_name='readings', verbose_name='Sensor')
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='readings', verbose_name='Fazenda')
    
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Data/Hora')
    
    # Variáveis coletadas
    dpv_kpa = models.FloatField(verbose_name='DPV (kPa)')
    humidity = models.FloatField(verbose_name='Umidade (%)')
    temperature = models.FloatField(verbose_name='Temperatura (°C)')
    battery = models.FloatField(verbose_name='Bateria (%)')

    def __str__(self):
        return f"Leitura {self.timestamp} - Sensor {self.sensor.id}"