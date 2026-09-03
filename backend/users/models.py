from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    """
    Manager customizado para gerenciar a criação de usuários com Email em vez de Username.
    """
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('O endereço de e-mail é obrigatório')
        
        email = self.normalize_email(email) # Padroniza o e-mail (ex: letras minúsculas)
        user = self.model(email=email, **extra_fields)
        user.set_password(password) # Criptografa a senha de forma segura (Hash)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser precisa ter is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser precisa ter is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de usuário customizado da aplicação.
    """
    email = models.EmailField(unique=True, verbose_name='E-mail')
    name = models.CharField(max_length=255, verbose_name='Nome')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Telefone')

    is_active = models.BooleanField(default=True, verbose_name='Ativo')
    is_staff = models.BooleanField(default=False, verbose_name='Equipe')
    date_joined = models.DateTimeField(auto_now_add=True, verbose_name='Data de Criação')

    # Dizemos ao Django que o campo de login principal será o e-mail
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name'] # Campos obrigatórios ao criar superuser pelo terminal

    objects = UserManager()


    def __str__(self):
        return self.email