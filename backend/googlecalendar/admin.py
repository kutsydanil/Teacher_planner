from django.contrib import admin
from .models import GoogleCalendar
# Register your models here.

@admin.register(GoogleCalendar)
class GoogleCalendarAdmin(admin.ModelAdmin):
    list_display = ('calendar_id', 'user', 'created_at')
    list_filter = ('created_at', 'user')