from django.db import models
from django.conf import settings
from django.utils import timezone

class GoogleCalendar(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='google_calendar', null=False, blank=False
    )
    calendar_id = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_sync = models.DateTimeField(null=True)

    class Meta:
        verbose_name = "Google Calendar"
        verbose_name_plural = "Google Calendars"

    def __str__(self):
        return f"Calendar {self.calendar_id} for {self.user.email}"