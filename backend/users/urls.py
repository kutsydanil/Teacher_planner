from django.urls import path
from .views import auth as auth_views, user as user_views

urlpatterns = [
    path('google/', auth_views.GoogleOAuthCallbackView.as_view(), name='google_login'),
    path('refresh/', auth_views.CookieTokenRefreshView.as_view(), name='refresh_token'),
    path('logout/', auth_views.CookieLogoutView.as_view(), name='logout'),
    path('user/', user_views.UserDetailView.as_view(), name='get_user'),
]