from django.contrib import admin
from .models import Farm, Sensor, Reading

@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner_name', 'manager', 'contact_phone')
    search_fields = ('name', 'owner_name')

@admin.register(Sensor)
class SensorAdmin(admin.ModelAdmin):
    list_display = ('sensor_id', 'farm', 'is_active', 'created_at')
    list_filter = ('is_active', 'farm')
    search_fields = ('sensor_id',)

@admin.register(Reading)
class ReadingAdmin(admin.ModelAdmin):
    list_display = ('sensor', 'timestamp', 'dpv_kpa', 'humidity', 'temperature')
    list_filter = ('sensor', 'timestamp')