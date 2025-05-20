from django.urls import path, include

urlpatterns = [
    path('auth/', include('users.urls')),
    path('', include('planner.urls')),
    path('health/', include('health_check.urls')),
]
