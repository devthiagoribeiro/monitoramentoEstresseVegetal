from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


class CustomUserAdmin(UserAdmin):
    """
    Configuração do painel administrativo para o nosso User customizado.
    Como tiramos o 'username', precisamos dizer ao Django quais campos exibir na tela.
    """
    model = User
    list_display = ('email', 'name', 'phone', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    search_fields = ('email', 'name')
    ordering = ('email',)
    
    # Como o nosso model usa e-mail no lugar de username, remapeamos os campos do formulário do Admin
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informações Pessoais', {'fields': ('name', 'phone')}),
        ('Permissões', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Datas importantes', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'phone', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )


admin.site.register(User, CustomUserAdmin)