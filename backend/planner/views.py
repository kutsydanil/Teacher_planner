
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.db.models.functions import ExtractMonth, ExtractYear
from datetime import datetime
from .models import Subject, Group, Event, Plan
from .serializers import (
    SubjectSerializer, GroupSerializer, EventSerializer, PlanSerializer, MonthlyStatsSerializer
)
from rest_framework.permissions import IsAuthenticated

class SubjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SubjectSerializer

    def get_queryset(self):
        return Subject.objects.filter(user=self.request.user)

class GroupViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = GroupSerializer

    def get_queryset(self):
        return Group.objects.filter(user=self.request.user)
    
class PlanViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PlanSerializer

    def get_queryset(self):
        return Plan.objects.filter(user=self.request.user)

class EventViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = EventSerializer

    def get_queryset(self):
        return Event.objects.filter(user=self.request.user)

from django.db.models import F, ExpressionWrapper, DurationField, Sum
from django.db.models.functions import ExtractMonth, ExtractYear

class StatsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = MonthlyStatsSerializer

    def list(self, request):
        current_date = datetime.now()
        return self.get_monthly_stats(request, current_date.month, current_date.year)

    @action(detail=False, methods=['get'])
    def by_month(self, request):
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        try:
            month = int(month)
            year = int(year)
        except (TypeError, ValueError):
            return Response({'message': 'Invalid month or year'}, status=status.HTTP_400_BAD_REQUEST)
        return self.get_monthly_stats(request, month, year)

    def get_monthly_stats(self, request, month, year):
        duration = ExpressionWrapper(F('end') - F('start'), output_field=DurationField())

        events = Event.objects.filter(
            user=request.user,
            start__month=month,
            start__year=year
        ).annotate(
            duration=duration,
            month=ExtractMonth('start'),
            year=ExtractYear('start')
        )

        stats = events.values(
            'group',
            'group__name',
            'subject',
            'subject__name',
            'type'
        ).annotate(
            total_duration=Sum('duration')
        )

        def round_duration(td):
            if td is None:
                return 0
            minutes = td.total_seconds() / 60
            if abs(minutes - 90) < 1:  # около 90 минут
                return 2
            elif abs(minutes - 45) < 1:  # около 45 минут
                return 1
            else:
                return minutes / 60  # точное время в часах

        stats_dict = {}
        for entry in stats:
            group_id = entry['group']
            subject_id = entry['subject']
            key = (group_id, subject_id)

            if key not in stats_dict:
                stats_dict[key] = {
                    'id': f"{group_id}_{subject_id}_{month}_{year}",
                    'group_id': group_id,
                    'group_name': entry['group__name'],
                    'subject_id': subject_id,
                    'subject_name': entry['subject__name'],
                    'lecture_hours': 0,
                    'practice_hours': 0,
                    'lab_hours': 0,
                    'other_hours': 0,
                    'month': month,
                    'year': year
                }

            type_field = f"{entry['type']}_hours"
            stats_dict[key][type_field] += round_duration(entry['total_duration'])

        formatted_stats = list(stats_dict.values())

        serializer = MonthlyStatsSerializer(formatted_stats, many=True)
        return Response(serializer.data)