import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

CELERY_BEAT_SCHEDULE = {
    'sync-google-calendars-every-minute': {
        'task': 'googlecalendar.tasks.periodic_full_sync',
        'schedule': crontab(),  # каждую минуту #'schedule': 120 600  - 10 мин
    }, 
}

app.conf.beat_schedule = CELERY_BEAT_SCHEDULE #Для запуска Shedule