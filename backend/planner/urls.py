from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'subjects', views.SubjectViewSet, basename='subject')
router.register(r'groups', views.GroupViewSet, basename='group')
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'plans', views.PlanViewSet, basename='plan')
router.register(r'stats', views.StatsViewSet, basename='stat')

urlpatterns = [
    path('', include(router.urls)),
]
