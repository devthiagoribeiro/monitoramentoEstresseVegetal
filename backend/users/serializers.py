from rest_framework import serializers
from django.contrib.auth import get_user_model

# get_user_model() busca o nosso Custom User Model de forma segura
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'phone'] 