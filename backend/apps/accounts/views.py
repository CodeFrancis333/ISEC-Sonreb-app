# backend/apps/accounts/views.py
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
)


def generate_tokens_for_user(user: User) -> str:
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token) 


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        name = serializer.validated_data["name"]
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "Email is already registered."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Use email as username
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=name,
            password=password,
        )

        token = generate_tokens_for_user(user)
        user_data = UserSerializer(user).data

        return Response(
            {
                "user": user_data,
                "token": token,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token = generate_tokens_for_user(user)
        user_data = UserSerializer(user).data

        return Response(
            {
                "user": user_data,
                "token": token,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data
        return Response(data)
