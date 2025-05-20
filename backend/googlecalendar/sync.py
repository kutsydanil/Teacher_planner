import logging
from datetime import timedelta, datetime
from django.utils import timezone
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from googleapiclient.errors import HttpError
from google.auth.transport.requests import Request
from allauth.socialaccount.models import SocialAccount, SocialApp
from planner.models import Event, Group, Subject, Plan
from .models import GoogleCalendar
from django.conf import settings
from django.db.models import Q

logger = logging.getLogger(__name__)

class GoogleCalendarSync:
    FIXED_DURATION = timedelta(hours=1, minutes=30)
    GOOGLE_API_VERSION = 'v3'
    GOOGLE_API_SERVICE_NAME = 'calendar'
    
    def __init__(self, user):
        self.user = user
        self.service = self._initialize_service()
        self.calendar_id = self._get_or_create_calendar()

    def _initialize_service(self):
        try:
            social_app = SocialApp.objects.get(provider='google')
            social_account = SocialAccount.objects.get(user=self.user, provider='google')
            social_token = social_account.socialtoken_set.first()
            
            credentials = Credentials(
                token=social_token.token,
                refresh_token=social_token.token_secret,
                token_uri='https://oauth2.googleapis.com/token',
                client_id=social_app.client_id,
                client_secret=social_app.secret
            )
            
            if credentials.expired:
                credentials.refresh(Request())
                social_token.token = credentials.token
                social_token.token_secret = credentials.refresh_token
                social_token.save()
            
            return build(
                self.GOOGLE_API_SERVICE_NAME,
                self.GOOGLE_API_VERSION,
                credentials=credentials,
                cache_discovery=False
            )
        except Exception as e:
            logger.error(f"Service initialization failed: {str(e)}")
            raise

    def _get_or_create_calendar(self):
        try:
            return self.user.google_calendar.calendar_id
        except GoogleCalendar.DoesNotExist:
            return self._create_google_calendar()

    def _create_google_calendar(self):
        calendar_body = {
            'summary': settings.GOOGLE_CALENDAR_NAME_PREFIX,
            'timeZone': 'Europe/Moscow',
            'description': 'Automatically created by Teacher Planner System'
        }
        try:
            created_calendar = self.service.calendars().insert(body=calendar_body).execute()
            GoogleCalendar.objects.create(user=self.user, calendar_id=created_calendar['id'])
            return created_calendar['id']
        except Exception as e:
            logger.error(f"Calendar creation failed: {str(e)}")
            raise

    def _parse_google_event(self, google_event):
        try:
            description = google_event.get('description', '')
            parts = {}
            for line in description.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    parts[key.strip()] = value.strip()
            
            start_data = google_event.get('start', {}).get('dateTime')
            end_data = google_event.get('end', {}).get('dateTime')
            updated_data = google_event.get('updated')

            if not all([start_data, end_data, updated_data]):
                 logger.error(f"Missing time data in Google event {google_event.get('id')}")
                 return None

            start = timezone.datetime.fromisoformat(start_data.replace('Z', '+00:00'))
            end = timezone.datetime.fromisoformat(end_data.replace('Z', '+00:00'))
            updated = timezone.datetime.fromisoformat(updated_data.replace('Z', '+00:00'))
            
            return {
                'id': google_event['id'],
                'title': google_event.get('summary', 'Untitled Event'),
                'start': start,
                'end': end,
                'location': google_event.get('location', ''),
                'group_name': parts.get('Group', ''),
                'subject_name': parts.get('Subject', ''),
                'type': parts.get('Type', 'other').lower(),
                'updated': updated
            }
        except Exception as e:
            logger.error(f"Event parsing failed for Google event {google_event.get('id')}: {str(e)}")
            return None

    def _validate_google_event(self, parsed_event):
        try:
            Group.objects.get(user=self.user, name=parsed_event['group_name'])
            Subject.objects.get(user=self.user, name=parsed_event['subject_name'])
        except (Group.DoesNotExist, Subject.DoesNotExist) as e:
            logger.warning(f"Related object not found: {str(e)}. Deleting Google event.")
            self._delete_google_event(parsed_event['id'])
            return False

        required_fields = ['group_name', 'subject_name', 'type', 'start', 'end']
        if not all(parsed_event.get(field) for field in required_fields):
            logger.warning(f"Missing required fields in parsed event {parsed_event.get('id')}")
            return False

        if parsed_event['type'] not in dict(Event.EVENT_TYPES).keys():
            logger.warning(f"Invalid event type: {parsed_event['type']} for parsed event {parsed_event.get('id')}")
            return False

        duration = parsed_event['end'] - parsed_event['start']
        if parsed_event['type'] in dict(Event.EVENT_TYPES):
            if abs(duration - self.FIXED_DURATION) > timedelta(minutes=1):
                logger.warning(f"Invalid duration for {parsed_event['type']} for parsed event {parsed_event.get('id')}")
                return False

        overlapping = Event.objects.filter(
            Q(start__lt=parsed_event['end']) & Q(end__gt=parsed_event['start']),
            user=self.user
        ).exclude(google_event_id=parsed_event['id'])
        
        if overlapping.exists():
            logger.warning(f"Parsed event {parsed_event.get('id')} overlaps with existing events")
            return False

        try:
            group = Group.objects.get(user=self.user, name=parsed_event['group_name'])
            subject = Subject.objects.get(user=self.user, name=parsed_event['subject_name'])
            plan = Plan.objects.get(user=self.user, group=group, subject=subject)
            
            events_qs = Event.objects.filter(
                user=self.user, group=group, subject=subject, type=parsed_event['type']
            ).exclude(google_event_id=parsed_event['id'])
            
            total_duration_seconds = sum((e.end - e.start).total_seconds() for e in events_qs) + duration.total_seconds()
            max_duration_seconds = getattr(plan, f"{parsed_event['type']}_hours", 0) * 3600
            
            if total_duration_seconds > max_duration_seconds:
                logger.warning(f"Parsed event {parsed_event.get('id')} exceeds plan duration limit")
                return False
        except Plan.DoesNotExist:
            logger.warning(f"Related plan not found for parsed event {parsed_event.get('id')}")
            return False
        
        return True

    def _should_update_local(self, local_event, google_updated_ts):
        if not local_event:
            return True
        
        local_updated_ts = local_event.last_update
        if timezone.is_naive(local_updated_ts):
            local_updated_ts = timezone.make_aware(local_updated_ts, timezone.get_default_timezone())
        
        return google_updated_ts > local_updated_ts

    def _should_update_google(self, event):
        if not event.google_event_id:
            return True
        try:
            google_event = self.service.events().get(calendarId=self.calendar_id, eventId=event.google_event_id).execute()
            google_updated_str = google_event.get('updated')
            if not google_updated_str:
                 return True

            google_updated_ts = timezone.datetime.fromisoformat(google_updated_str.replace('Z', '+00:00'))
            
            local_updated_ts = event.last_update
            if timezone.is_naive(local_updated_ts):
                 local_updated_ts = timezone.make_aware(local_updated_ts, timezone.get_default_timezone())

            return local_updated_ts > google_updated_ts
        except HttpError as e:
            if e.resp.status == 404:
                return True
            logger.error(f"Google API error checking event {event.google_event_id}: {str(e)}")
            return False 
        except Exception as e:
            logger.error(f"Failed to check Google version for event {event.id}: {str(e)}")
            return False

    def sync_google_to_local(self):
        try:
            events_from_google = []
            page_token = None
            time_min = (timezone.now() - timedelta(days=30)).isoformat()
            
            logger.info(f"Starting sync_google_to_local for user {self.user.id}")
            while True:
                result = self.service.events().list(
                    calendarId=self.calendar_id,
                    timeMin=time_min,
                    pageToken=page_token,
                    singleEvents=True,
                    orderBy='startTime',
                    showDeleted=True
                ).execute()
                events_from_google.extend(result.get('items', []))
                page_token = result.get('nextPageToken')
                if not page_token:
                    break

            logger.info(f"Total events to check: {len(events_from_google)}")

            processed_google_ids = set()
            for google_event_data in events_from_google:
                event_id = google_event_data.get('id')
                
                # Обработка удаленных событий FIRST
                if google_event_data.get('status') == 'cancelled':
                    deleted_count, _ = Event.objects.filter(google_event_id=event_id).delete()
                    if deleted_count > 0:
                        logger.info(f"Deleted local event with Google ID {event_id} (marked as cancelled in Google)")
                    processed_google_ids.add(event_id)
                    continue

                parsed_event = self._parse_google_event(google_event_data)
                if not parsed_event:
                    processed_google_ids.add(event_id)
                    continue
                    
                processed_google_ids.add(parsed_event['id'])

                if not self._validate_google_event(parsed_event):
                    logger.warning(f"Google event {parsed_event['id']} is invalid. Deleting from Google.")
                    self._delete_google_event(parsed_event['id'])
                    processed_google_ids.add(parsed_event['id'])
                    continue

                local_event = Event.objects.filter(google_event_id=parsed_event['id'], user=self.user).first()
                
                if self._should_update_local(local_event, parsed_event['updated']):
                    self._save_google_event(parsed_event, local_event)
                else:
                    logger.info(f"Skipping Google event {parsed_event['id']} as local version is newer or same.")
            
            # Удаление локальных событий, отсутствующих в Google
            stale_local_events = Event.objects.filter(
                user=self.user,
                google_calendar_id=self.calendar_id,
                google_event_id__isnull=False
            ).exclude(google_event_id__in=list(processed_google_ids))
            
            for stale_event in stale_local_events:
                logger.info(f"Checking existence for stale event {stale_event.id} (Google ID: {stale_event.google_event_id})")
                try:
                    self.service.events().get(
                        calendarId=self.calendar_id,
                        eventId=stale_event.google_event_id
                    ).execute()
                except HttpError as e:
                    if e.resp.status in (404, 410):
                        logger.info(f"Deleting stale local event {stale_event.id} (Google ID: {stale_event.google_event_id})")
                        stale_event.delete()
                    else:
                        logger.error(f"Google API error checking event {stale_event.google_event_id}: {str(e)}")
                except Exception as e:
                    logger.error(f"Error checking event existence: {str(e)}")
                    continue

            if hasattr(self.user, 'google_calendar') and self.user.google_calendar:
                self.user.google_calendar.last_sync = timezone.now()
                self.user.google_calendar.save(update_fields=['last_sync'])

        except Exception as e:
            logger.error(f"Google to local sync failed for user {self.user.id}: {str(e)}")
            raise

    def _save_google_event(self, parsed_event, existing_event=None):
        try:
            group = Group.objects.get(user=self.user, name=parsed_event['group_name'])
            subject = Subject.objects.get(user=self.user, name=parsed_event['subject_name'])

            defaults = {
                'user': self.user,
                'title': parsed_event['title'],
                'start': parsed_event['start'],
                'end': parsed_event['end'],
                'group': group,
                'subject': subject,
                'type': parsed_event['type'],
                'location': parsed_event['location'],
                'notes': parsed_event.get('notes', ''), 
                'google_calendar_id': self.calendar_id,
                'is_syncing': True, 
                'last_update': parsed_event['updated'] 
            }
            
            event, created = Event.objects.update_or_create(
                google_event_id=parsed_event['id'],
                user=self.user,
                defaults=defaults
            )
            
            if event.is_syncing:
                event.is_syncing = False
                event.save(update_fields=['is_syncing'])

            if created:
                logger.info(f"Created new event from Google: {event.id} (google_id: {parsed_event['id']})")
            else:
                logger.info(f"Updated existing event from Google: {event.id} (google_id: {parsed_event['id']})")

        except (Group.DoesNotExist, Subject.DoesNotExist) as e:
            logger.warning(f"Cannot save event from Google (google_id: {parsed_event.get('id')}) due to missing Group/Subject: {str(e)}.")
        except Exception as e:
            logger.error(f"Failed to save event from Google (google_id: {parsed_event.get('id')}): {str(e)}")

    def _delete_google_event(self, event_id):
        try:
            self.service.events().delete(calendarId=self.calendar_id, eventId=event_id).execute()
            logger.info(f"Deleted Google event: {event_id}")
        except HttpError as e:
            if e.resp.status in (404, 410):
                logger.warning(f"Event {event_id} not found or already deleted in Google Calendar.")
                Event.objects.filter(google_event_id=event_id).update(google_event_id=None)
            else:
                logger.error(f"Google API error deleting event {event_id}: {str(e)}")
        except Exception as e:
            logger.error(f"Failed to delete Google event {event_id}: {str(e)}")

    def sync_local_to_google(self, event):
        try:
            if not self._should_update_google(event):
                logger.info(f"Skipping older local event: {event.id} (google_id: {event.google_event_id}) for sync to Google.")
                return

            event_data = {
                'summary': event.title,
                'description': f"Group: {event.group.name}\nSubject: {event.subject.name}\nType: {event.type}\nNotes: {event.notes or ''}",
                'start': {'dateTime': event.start.isoformat(), 'timeZone': str(event.start.tzinfo or timezone.get_default_timezone())},
                'end': {'dateTime': event.end.isoformat(), 'timeZone': str(event.end.tzinfo or timezone.get_default_timezone())},
                'location': event.location or '',
            }

            google_api_event_id = None

            if event.google_event_id:
                updated_g_event = self.service.events().update(
                    calendarId=self.calendar_id, eventId=event.google_event_id, body=event_data
                ).execute()
                google_api_event_id = updated_g_event.get('id')
                logger.info(f"Updated event {event.id} in Google Calendar (google_id: {google_api_event_id})")
            else:
                created_g_event = self.service.events().insert(
                    calendarId=self.calendar_id, body=event_data
                ).execute()
                google_api_event_id = created_g_event.get('id')
                event.google_event_id = google_api_event_id
                logger.info(f"Created new event {event.id} in Google Calendar (google_id: {google_api_event_id})")

            event.google_calendar_id = self.calendar_id
            event.save(update_fields=['google_event_id', 'google_calendar_id'])

        except HttpError as e:
            logger.error(f"Google API error syncing event {event.id} to Google: {str(e)}")
            if e.resp.status == 404 and event.google_event_id:
                logger.warning(f"Event {event.google_event_id} not found in Google. Clearing local google_event_id.")
                event.google_event_id = None
                event.save(update_fields=['google_event_id'])
            raise
        except Exception as e:
            logger.error(f"Sync failed for event {event.id} to Google: {str(e)}")
            raise

    def full_sync(self):
        try:
            logger.info(f"Starting full sync for user {self.user.id}")
            self.sync_google_to_local()
            self.sync_local_to_google_all()
            logger.info(f"Completed full sync for user {self.user.id}")
        except Exception as e:
            logger.error(f"Full sync failed for user {self.user.id}: {str(e)}")
            raise 

    def sync_local_to_google_all(self):
        try:
            events_to_sync = Event.objects.filter(user=self.user) 
            total = events_to_sync.count()
            synced_count = 0
            skipped_due_to_syncing_flag = 0
            
            logger.info(f"Starting sync_local_to_google_all for user {self.user.id}. Total events to check: {total}")

            for event in events_to_sync:
                try:
                    current_event = Event.objects.get(pk=event.pk)
                    if current_event.is_syncing:
                        logger.info(f"Event {event.id} is marked as is_syncing. Skipping.")
                        skipped_due_to_syncing_flag += 1
                        continue

                    current_event.is_syncing = True
                    current_event.save(update_fields=['is_syncing'])
                    
                    try:
                        self.sync_local_to_google(current_event)
                        synced_count += 1
                    finally:
                        current_event.is_syncing = False
                        current_event.save(update_fields=['is_syncing'])
                except Event.DoesNotExist:
                    logger.warning(f"Event {event.id} was deleted during sync iteration.")
                except Exception as e:
                    logger.error(f"Error syncing event {event.id}: {str(e)}")
            
            logger.info(f"Local to Google sync all complete. Processed: {synced_count}, Skipped: {skipped_due_to_syncing_flag}")
            
        except Exception as e:
            logger.error(f"General error in sync_local_to_google_all: {str(e)}")
            raise