from django.contrib import admin
from .models import Subject, Group, Event, Plan

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('created_at', 'user')

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('created_at', 'user')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'group', 'subject', 'type', 'start', 'end', 'user')
    search_fields = ('title', 'location', 'notes', 'group__name', 'subject__name')
    list_filter = ('type', 'start', 'user', 'group', 'subject')

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'group', 'subject', 'lecture_hours', 'practice_hours', 'lab_hours', 'other_hours', 'user')
    search_fields = ('title', 'group__name', 'subject__name')
    list_filter = ('user', 'group', 'subject')
