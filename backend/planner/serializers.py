from datetime import timedelta
from rest_framework import serializers
from django.db import IntegrityError
from rest_framework.exceptions import ValidationError
from .models import Subject, Group, Event, Plan
from datetime import timezone as timedata
from django.utils import timezone

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

    class Meta:
        model = Subject
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        try:
            return super().create(validated_data)
        except IntegrityError as e:
            if 'unique' in str(e).lower():
                raise ValidationError({'name': 'Subject with this name already exists.'})
            raise

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except IntegrityError as e:
            if 'unique' in str(e).lower():
                raise ValidationError({'name': 'Subject with this name already exists.'})
            raise

class GroupSerializer(serializers.ModelSerializer):

    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'color', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class PlanSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Plan
        fields = ['id', 'name', 'group', 'group_name', 'subject', 'subject_name', 
                  'lecture_hours', 'practice_hours', 'lab_hours', 
                  'other_hours', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class EventSerializer(serializers.ModelSerializer):
    FIXED_DURATION = timedelta(hours=1, minutes=30)

    # start = serializers.DateTimeField(format='%Y-%m-%dT%H:%M:%S%z', input_formats=['%Y-%m-%dT%H:%M:%S%z', 'iso-8601'])
    # end = serializers.DateTimeField(format='%Y-%m-%dT%H:%M:%S%z', input_formats=['%Y-%m-%dT%H:%M:%S%z', 'iso-8601'])

    start = serializers.DateTimeField(
        format='iso-8601', 
        input_formats=['iso-8601'],
        default_timezone=timedata.utc
    )
    end = serializers.DateTimeField(
        format='iso-8601', 
        input_formats=['iso-8601'],
        default_timezone=timedata.utc
    )

    group_name = serializers.CharField(source='group.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    color = serializers.CharField(source='group.color', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'group', 'group_name', 'subject', 'subject_name',
            'start', 'end', 'type', 'location', 'notes', 'color',
            'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def validate(self, data):
        user = self.context['request'].user
        group = data.get('group') or (self.instance.group if self.instance else None)
        subject = data.get('subject') or (self.instance.subject if self.instance else None)
        event_type = data.get('type') or (self.instance.type if self.instance else None)
        start = data.get('start') or (self.instance.start if self.instance else None)
        end = data.get('end') or (self.instance.end if self.instance else None)

        if not all([group, subject, event_type, start, end]):
            raise serializers.ValidationError("Fields group, subject, type, start and end are required.")

        if start and timezone.is_naive(start):
            start = timezone.make_aware(start, timezone.utc)
        if end and timezone.is_naive(end):
            end = timezone.make_aware(end, timezone.utc)

        # Проверка, что start не в прошлом
        now = timezone.now()
        if start < now:
            raise serializers.ValidationError("Start time cannot be in the past.")

        duration = end - start
        duration_hours = duration.total_seconds() / 3600

        # Проверка длительности для типов lecture, practice, lab
        if event_type in ['lecture', 'practice', 'lab']:
            if abs(duration - self.FIXED_DURATION) > timedelta(minutes=1):
                raise serializers.ValidationError(
                    f"For {event_type} duration must be exactly 2 academic hours (1.5 real hours)"
                )

        if end <= start:
            raise serializers.ValidationError("End time must be after start time.")

        # Проверка пересечения со всеми событиями пользователя
        overlapping = Event.objects.filter(
            user=user,
            start__lt=end,
            end__gt=start,
        )
        if self.instance:
            overlapping = overlapping.exclude(pk=self.instance.pk)

        if overlapping.exists():
            raise serializers.ValidationError("This event overlaps with another event in the user's schedule.")

        # Проверка лимитов по плану
        try:
            plan = Plan.objects.get(user=user, group=group, subject=subject)
        except Plan.DoesNotExist:
            raise serializers.ValidationError("Plan for this user, group, and subject does not exist.")

        events_qs = Event.objects.filter(
            user=user,
            group=group,
            subject=subject,
            type=event_type,
        )
        if self.instance:
            events_qs = events_qs.exclude(pk=self.instance.pk)

        used_hours = sum(
            (event.end - event.start).total_seconds() / 3600
            for event in events_qs
        )

        total_hours = used_hours + duration_hours

        plan_hours_map = {
            'lecture': plan.lecture_hours,
            'practice': plan.practice_hours,
            'lab': plan.lab_hours,
            'other': plan.other_hours,
        }

        if total_hours > plan_hours_map.get(event_type, 0):
            raise serializers.ValidationError(
                f"Exceeded the hour limit for event type '{event_type}'. "
                f"Limit: {plan_hours_map.get(event_type, 0)}, already scheduled: {used_hours:.2f}."
            )

        return data

class MonthlyStatsSerializer(serializers.Serializer):
    id = serializers.CharField()
    group_id = serializers.CharField()
    group_name = serializers.CharField()
    subject_id = serializers.CharField()
    subject_name = serializers.CharField()
    lecture_hours = serializers.IntegerField()
    practice_hours = serializers.IntegerField()
    lab_hours = serializers.IntegerField()
    other_hours = serializers.IntegerField()
    month = serializers.IntegerField()
    year = serializers.IntegerField()
