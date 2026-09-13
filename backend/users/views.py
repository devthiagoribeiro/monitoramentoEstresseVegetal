from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import authenticate, login, logout
from .serializers import UserSerializer

class LoginView(APIView):
    # Lembra que trancamos a API inteira no settings.py? 
    # Aqui abrimos uma exceção, pois quem vai fazer login ainda não está autenticado.
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # 1. Pegamos os dados que o React vai enviar no corpo da requisição (JSON)
        email = request.data.get('email')
        password = request.data.get('password')

        # 2. O Django verifica de forma segura se o e-mail e a senha batem com o banco
        user = authenticate(request, email=email, password=password)

        if user is not None:
            # 3. Credenciais corretas! Criamos a sessão e o cookie.
            login(request, user)
            
            # 4. Usamos nosso Serializer para converter os dados do usuário em JSON
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # Credenciais incorretas (retornamos erro 401 Unauthorized)
            return Response({"detail": "Credenciais inválidas."}, status=status.HTTP_401_UNAUTHORIZED)