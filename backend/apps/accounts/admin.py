from django.contrib import admin
from django.contrib.auth.models import User


class CustomUserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "is_staff", "is_active", "date_joined")
    search_fields = ("username", "email")
    list_filter = ("is_staff", "is_active")


# Reuse default User model but with nicer listing
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)