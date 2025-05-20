from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from allauth.socialaccount.models import SocialAccount

User = get_user_model()

class CustomUserAdmin(UserAdmin):
    """
    Настройки админки для модели User.
    """
    list_display = ('id', 'email', 'username', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser', 'is_email_verified')  # Поля для отображения в списке
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'is_email_verified')
    search_fields = ('email', 'username', 'first_name', 'last_name') 
    ordering = ('email',) 
    readonly_fields = ('id',) 

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'picture')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_email_verified', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

admin.site.register(User, CustomUserAdmin)
