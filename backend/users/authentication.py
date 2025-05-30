from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

#Кастомный класс для получения токенов не из заголовков, а из куков
class JWTCookieAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        
        if header is None:
            raw_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
            if raw_token is None:
                return None
        else:
            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token