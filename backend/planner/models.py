from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class Subject(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=False, blank=False)
    name = models.CharField(max_length=100, null=False, blank=False)
    description = models.TextField(max_length=150, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_update = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['-created_at']
        unique_together = ['name', 'user']

    def __str__(self):
        return self.name

class Group(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, blank=False, null=False)
    name = models.CharField(max_length=100, null=False, blank=False)
    color = models.CharField(max_length=7, null=False, blank=False)  # Hex color code
    description = models.TextField(max_length=150, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_update = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['name', 'user']

    def __str__(self):
        return f"{self.name}"

class Plan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=False, blank=False)
    name = models.CharField(max_length=100, null=False, blank=False)

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='plans', null=False, blank=False)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='plans', null=False, blank=False)

    lecture_hours = models.PositiveIntegerField(default=0, null=True, blank=True)
    practice_hours = models.PositiveIntegerField(default=0, null=True, blank=True)
    lab_hours = models.PositiveIntegerField(default=0, null=True, blank=True)
    other_hours = models.PositiveIntegerField(default=0, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    last_update = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['name', 'user']
    

class Event(models.Model):
    EVENT_TYPES = [
        ('lecture', 'Lecture'),
        ('practice', 'Practice'),
        ('lab', 'Lab'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=False, blank=False)

    title = models.CharField(max_length=200, blank=False, null=False)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='events', null=False, blank=False)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='events', null=False, blank=False)

    start = models.DateTimeField(blank=False, null=False)
    end = models.DateTimeField(blank=False, null=False)
    type = models.CharField(max_length=10, choices=EVENT_TYPES)

    location = models.CharField(max_length=200, blank=True)
    notes = models.TextField(max_length=300, blank=True)

    google_event_id = models.CharField(max_length=255, blank=True, null=True)
    google_calendar_id = models.CharField(max_length=255, blank=True, null=True)

    is_syncing = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    last_update = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start', 'end']

    def __str__(self):
        return f"{self.title} - {self.group.name} - {self.subject.name}"

    def clean(self):
        if self.end <= self.start:
            raise ValidationError('End time must be after start time')
        
    
