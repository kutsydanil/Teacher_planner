from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True, db_index=True)
    picture = models.URLField(blank=True, help_text="Profile picture URL")
    is_email_verified = models.BooleanField(default=True, help_text="Verification status")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"