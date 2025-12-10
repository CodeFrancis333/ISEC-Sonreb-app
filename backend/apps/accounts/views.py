# backend/apps/accounts/views.py
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils import timezone
import secrets
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
from .models import EmailVerification


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
            is_active=False,  # require verification
        )

        verification = create_email_verification(user)

        return Response(
            {
                "detail": "Account created. Verify email to activate.",
                "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                "code": verification.code,  # For dev/testing; in prod send email.
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

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.check_password(password):
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {
                    "detail": "Account not verified. Please verify your email.",
                    "require_verification": True,
                    "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                },
                status=status.HTTP_403_FORBIDDEN,
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


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Always respond success to avoid email enumeration
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "If this email exists, reset instructions were sent."})

        token_generator = PasswordResetTokenGenerator()
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)

        # In production, send email here. For now, return token for client flow.
        return Response(
            {
                "detail": "Reset token generated.",
                "uid": uid,
                "token": token,
            }
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not uid or not token or not new_password or not confirm_password:
            return Response(
                {"detail": "uid, token, new_password, confirm_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {"detail": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response(
                {"detail": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user=user)
        except ValidationError as exc:
            return Response(
                {"detail": exc.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        return Response({"detail": "Password has been reset successfully."})
def create_email_verification(user: User) -> EmailVerification:
    # Invalidate prior active codes
    EmailVerification.objects.filter(user=user, used=False).delete()
    code = f"{secrets.randbelow(1000000):06d}"
    expires_at = timezone.now() + timezone.timedelta(minutes=15)
    verification = EmailVerification.objects.create(
        user=user,
        code=code,
        expires_at=expires_at,
    )
    return verification


class SendVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "If this email exists, a code was sent."})

        verification = create_email_verification(user)
        return Response(
            {
                "detail": "Verification code created.",
                "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                "code": verification.code,  # return for dev/testing
            }
        )


class ConfirmVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        code = request.data.get("code")
        if not uid or not code:
            return Response(
                {"detail": "uid and code are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response(
                {"detail": "Invalid verification request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verification = (
            EmailVerification.objects.filter(user=user, code=code, used=False)
            .order_by("-created_at")
            .first()
        )
        if not verification:
            return Response(
                {"detail": "Invalid code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if verification.expires_at < timezone.now():
            return Response(
                {"detail": "Code expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verification.used = True
        verification.save()

        user.is_active = True
        user.save()

        token = generate_tokens_for_user(user)
        return Response(
            {
                "detail": "Email verified.",
                "token": token,
                "user": UserSerializer(user).data,
            }
        )
