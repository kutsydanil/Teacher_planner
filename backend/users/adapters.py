from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.exceptions import ImmediateHttpResponse
from rest_framework.response import Response
from rest_framework import status

#Отвечает за синхронизацию с аккаунтами
class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        if sociallogin.is_existing:
            return

        # Check if user exists with given email address
        email = sociallogin.account.extra_data.get('email')
        if email:
            user = self.get_user_model().objects.filter(email=email).first()
            if user:
                sociallogin.connect(request, user)

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        if sociallogin.account.provider == 'google':
            extra_data = sociallogin.account.extra_data
            user.first_name = extra_data.get('given_name', '')
            user.last_name = extra_data.get('family_name', '')
            user.picture = extra_data.get('picture', '')
            user.is_email_verified = extra_data.get('email_verified', False)
        return user