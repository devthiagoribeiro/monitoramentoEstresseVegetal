from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import authenticate, login
from .serializers import UserSerializer

class LoginView(APIView):
    # Esvaziamos a autenticação para o DRF não rodar o SessionAuthentication (e não pedir o CSRF)
    authentication_classes = [] 
    
    # Mantemos a permissão aberta
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        user = authenticate(request, email=email, password=password)

        if user is not None:
            # O login cria a sessão no banco e devolve o cookie (e o token CSRF) para as próximas requisições
            login(request, user)
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Credenciais inválidas."}, status=status.HTTP_401_UNAUTHORIZED)