from rest_framework import serializers
from django.contrib.auth import get_user_model
from allauth.socialaccount.models import SocialAccount

import logging
logger = logging.getLogger(__name__)

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'picture', 'is_email_verified']
        read_only_fields = ['id', 'email', 'is_email_verified']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            social_account = instance.socialaccount_set.first()
            if social_account:
                extra_data = social_account.extra_data
                data['picture'] = extra_data.get('picture')
                data['name'] = f"{instance.first_name} {instance.last_name}".strip() or extra_data.get('name')

        except SocialAccount.DoesNotExist:
            logger.warning(f"SocialAccount not found for user {instance.id}")
        except Exception as e:
            logger.error(f"Error accessing SocialAccount data: {e}")
        return data