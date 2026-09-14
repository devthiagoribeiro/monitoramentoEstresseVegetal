from django.contrib import admin
from .models import Farm, Sensor, Reading

@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner_name', 'manager', 'contact_phone')
    search_fields = ('name', 'owner_name')

@admin.register(Sensor)
class SensorAdmin(admin.ModelAdmin):
    list_display = ('device', 'farm', 'is_active', 'created_at')
    list_filter = ('is_active', 'farm')
    search_fields = ('instalação',)

@admin.register(Reading)
class ReadingAdmin(admin.ModelAdmin):
    list_display = ('sensor', 'timestamp', 'dpv_kpa', 'humidity', 'temperature')
    list_filter = ('sensor', 'timestamp')

from .models import Farm, Sensor, Reading, AuthorizedDevice

# ... seus registros anteriores ...

@admin.register(AuthorizedDevice)
class AuthorizedDeviceAdmin(admin.ModelAdmin):
    list_display = ('mac_address', 'is_used', 'created_at')
    search_fields = ('mac_address',)
    list_filter = ('is_used',)