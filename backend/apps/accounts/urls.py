# backend/apps/accounts/urls.py
from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    MeView,
    ForgotPasswordView,
    ResetPasswordView,
    SendVerificationView,
    ConfirmVerificationView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("forgot/", ForgotPasswordView.as_view(), name="auth-forgot"),
    path("reset/", ResetPasswordView.as_view(), name="auth-reset"),
    path("verify/send/", SendVerificationView.as_view(), name="auth-verify-send"),
    path("verify/confirm/", ConfirmVerificationView.as_view(), name="auth-verify-confirm"),
]
