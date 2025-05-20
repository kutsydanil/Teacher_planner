from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone
from .sync import GoogleCalendarSync
import logging
from planner.models import Event

logger = logging.getLogger(__name__)
User = get_user_model()

@shared_task(bind=True, max_retries=3)
def sync_single_event(self, event_id):
    event = None
    try:
        event = Event.objects.get(id=event_id)
        if not hasattr(event.user, "google_calendar"):
            logger.info(f"User {event.user.id} for event {event_id} has no google_calendar setup. Skipping sync.")
            return

        if event.is_syncing:
            logger.warning(f"Event {event_id} is already syncing. Retrying or skipping...")
            raise self.retry(exc=Exception(f"Sync already in progress for event {event_id}"), countdown=10)
            
        event.is_syncing = True
        event.save(update_fields=['is_syncing'])
        
        logger.info(f"Starting sync for event {event_id}")
        sync = GoogleCalendarSync(event.user)
        sync.sync_local_to_google(event)
        logger.info(f"Successfully synced event {event_id}")

    except Event.DoesNotExist:
        logger.error(f"Event {event_id} not found for sync.")
    except Exception as e:
        logger.error(f"Error syncing event {event_id}: {str(e)}")
        if event:
            try:
                event_to_reset = Event.objects.get(id=event_id)
                if event_to_reset.is_syncing:
                    event_to_reset.is_syncing = False
                    event_to_reset.save(update_fields=['is_syncing'])
            except Event.DoesNotExist:
                logger.warning(f"Event {event_id} not found when trying to reset is_syncing flag in except block.")
            except Exception as reset_exc:
                logger.error(f"Error resetting is_syncing for event {event_id} in except block: {reset_exc}")
        raise self.retry(exc=e, countdown=30)
    finally:
        if event_id:
            try:
                final_event_state = Event.objects.get(id=event_id)
                if final_event_state.is_syncing:
                    final_event_state.is_syncing = False
                    final_event_state.save(update_fields=['is_syncing'])
                    logger.info(f"Reset is_syncing flag for event {event_id} in finally block.")
            except Event.DoesNotExist:
                logger.warning(f"Event {event_id} not found in finally block when trying to reset is_syncing.")
            except Exception as final_exc:
                logger.error(f"Error in finally block for event {event_id} while resetting is_syncing: {final_exc}")

@shared_task(bind=True, max_retries=3)
def full_sync_user(self, user_id):
    try:
        user = User.objects.get(id=user_id)
        if hasattr(user, 'google_calendar'):
            sync = GoogleCalendarSync(user)
            sync.sync_google_to_local()
            sync.sync_local_to_google_all()
            return f"Synced user {user_id}"
        return f"No Google Calendar for user {user_id}"
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
    except Exception as e:
        logger.error(f"Sync failed for user {user_id}: {str(e)}")
        self.retry(exc=e, countdown=60)

@shared_task
def periodic_full_sync():
    try:
        users = User.objects.filter(google_calendar__isnull=False)
        for user in users:
            full_sync_user.delay(user.id)
        logger.info(f"Periodic sync started for {users.count()} users")
    except Exception as e:
        logger.error(f"Periodic sync failed: {str(e)}")
        raise

@shared_task(bind=True, max_retries=3)
def create_google_calendar_task(self, user_id):
    try:
        user = User.objects.get(id=user_id)
        if hasattr(user, 'google_calendar'):
            return user.google_calendar.calendar_id
        sync = GoogleCalendarSync(user)
        calendar_id = sync._get_or_create_calendar()
        logger.info(f"Created Google Calendar for user {user_id}")
        return calendar_id
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
    except Exception as e:
        logger.error(f"Calendar creation failed: {str(e)}")
        self.retry(exc=e, countdown=30)