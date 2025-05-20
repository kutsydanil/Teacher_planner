from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from googlecalendar.tasks import sync_single_event
from googlecalendar.sync import GoogleCalendarSync 
from .models import Event
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Event)
def handle_event_save(sender, instance, created, update_fields, **kwargs):
    if instance.is_syncing:
        logger.debug(f"Event {instance.id} save triggered while is_syncing=True. Skipping new sync task.")
        return

    if update_fields:
        is_only_sync_or_time_fields = all(field_name in ['is_syncing', 'last_update'] for field_name in update_fields)
        if 'is_syncing' in update_fields and is_only_sync_or_time_fields:
            logger.debug(f"Event {instance.id} save likely for resetting is_syncing flag (update_fields: {update_fields}). Skipping new sync task.")
            return

    if hasattr(instance.user, "google_calendar"):
        try:
            logger.info(f"Event {instance.id} {'created' if created else 'updated'}. Queuing sync task. Update_fields: {update_fields}")
            sync_single_event.delay(instance.id)
        except Exception as e:
            logger.error(f"Failed to queue sync task for event {instance.id}: {str(e)}")
    else:
        logger.info(f"Event {instance.id} {'created' if created else 'updated'}, but user {instance.user.id} has no google_calendar. Sync skipped.")


@receiver(post_delete, sender=Event)
def handle_event_delete(sender, instance, **kwargs):
    if instance.google_event_id and hasattr(instance.user, 'google_calendar'):
        try:
            sync = GoogleCalendarSync(instance.user)
            sync._delete_google_event(instance.google_event_id)
            logger.info(f"Deleted Google event {instance.google_event_id}")
        except Exception as e:
            logger.error(f"Google event deletion failed: {str(e)}")