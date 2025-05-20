import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.views import APIView
from allauth.socialaccount.models import SocialAccount, SocialToken, SocialApp
from dj_rest_auth.registration.views import SocialLoginView
from dj_rest_auth.views import LogoutView
from ..mixins import JWTCookieMixin
import requests as pyrequests
from ..serializers import UserSerializer
from google.oauth2 import id_token
from google.auth.transport import requests
from googlecalendar.tasks import create_google_calendar_task

User = get_user_model()
logger = logging.getLogger(__name__)

def _handle_social_app(provider='google'):
    """Helper function to get the SocialApp object."""
    try:
        return SocialApp.objects.get(provider=provider)
    except SocialApp.DoesNotExist:
        logger.error(f'SocialApp with provider {provider} not configured')
        return None

def _handle_user_info_from_id_token(id_token_str, client_id):
    """Helper function to get user information from the ID token."""
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests
    try:
        return google_id_token.verify_oauth2_token(id_token_str, google_requests.Request(), client_id)
    except ValueError as e:
        logger.error(f'Invalid ID token: {e}')
        return None

def _handle_social_account(user, idinfo, provider='google'):
    """Helper function to create or update the SocialAccount."""
    return SocialAccount.objects.get_or_create(
        user=user,
        provider=provider,
        defaults={'uid': idinfo.get('sub'), 'extra_data': idinfo}
    )

def _handle_social_token(social_account, app, access_token, refresh_token, expires_at):
    """Helper function to update or create the SocialToken."""
    SocialToken.objects.update_or_create(
        account=social_account,
        app=app,
        defaults={
            'token': access_token,
            'token_secret': refresh_token,
            'expires_at': expires_at
        }
    )

def _handle_jwt_response(user):
    """Helper function to generate the JWT response."""
    refresh = RefreshToken.for_user(user)
    return {
        'user': UserSerializer(user).data,
        'token': str(refresh.access_token),
        'refresh': str(refresh)
    }

def _handle_google_tokens_exchange(code, social_app):
    """Helper function to exchange Google auth code for tokens."""

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": social_app.client_id,
        "client_secret": social_app.secret,
        "redirect_uri": "postmessage",
        "grant_type": "authorization_code"
    }
    try:
        token_resp = pyrequests.post(token_url, data=data)
        token_resp.raise_for_status()  # Raise an exception for bad status codes
        return token_resp.json()
    except pyrequests.exceptions.RequestException as e:
        logger.error(f"Failed to exchange code for tokens: {e}")
        return None

class GoogleOAuthCallbackView(JWTCookieMixin, APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({'message': 'No code provided'}, status=status.HTTP_400_BAD_REQUEST)

        social_app = _handle_social_app()
        if not social_app:
            return Response({'message': 'Google SocialApp not configured'}, status=500)

        token_data = _handle_google_tokens_exchange(code, social_app)
        if not token_data:
            return Response({'message': 'Failed to get tokens from Google'}, status=400)

        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        id_token_str = token_data.get("id_token")
        expires_in = token_data.get("expires_in")
        expires_at = timezone.now() + timezone.timedelta(seconds=expires_in) if expires_in else None

        idinfo = _handle_user_info_from_id_token(id_token_str, social_app.client_id)
        if not idinfo or 'email' not in idinfo:
            return Response({'message': 'Invalid ID token or email not found'}, status=400)

        email = idinfo['email']
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': idinfo.get('given_name', ''),
                'last_name': idinfo.get('family_name', ''),
                'is_email_verified': idinfo.get('email_verified', False),
            }
        )

        social_account, _ = _handle_social_account(user, idinfo)
        _handle_social_token(social_account, social_app, access_token, refresh_token, expires_at)

        jwt_data = _handle_jwt_response(user)
        response = Response(jwt_data, status=200)
 
        response = self.set_jwt_cookies(response, jwt_data['token'], jwt_data['refresh'])

        create_google_calendar_task.delay(user.id)
        logger.info(f"Celery task 'create_google_calendar_task' dispatched for user {user.id}")

        return response


class CookieTokenRefreshView(JWTCookieMixin, TokenRefreshView):
    permission_classes = [AllowAny, ]

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
            if not refresh_token:
                return Response({'message': 'No refresh token provided'}, status=status.HTTP_400_BAD_REQUEST)

            serializer = self.get_serializer(data={'refresh': refresh_token})
            serializer.is_valid(raise_exception=True)

            access = serializer.validated_data.get('access')
            refresh = serializer.validated_data.get('refresh')

            response = Response({'message': 'Token refreshed successfully'}, status=status.HTTP_200_OK)
            response = self.set_jwt_cookies(response, access, refresh)
            return response

        except Exception as e:
            logger.exception(f'Error during token refresh: {e}')
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CookieLogoutView(LogoutView):
    permission_classes = [IsAuthenticated, ]

    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            response = Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
            response.delete_cookie(
                settings.SIMPLE_JWT['AUTH_COOKIE'],
                path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/')
            )
            response.delete_cookie(
                settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                path=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH_PATH', '/')
            )
            return response
        except Exception as e:
            logger.exception(f'Error during logout: {e}')
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)