from rest_framework.routers import DefaultRouter

from .views import (
    ActivityViewSet,
    CompanyViewSet,
    ContactViewSet,
    NoteViewSet,
    TagViewSet,
)

router = DefaultRouter()
router.register("tags", TagViewSet)
router.register("companies", CompanyViewSet)
router.register("contacts", ContactViewSet)
router.register("notes", NoteViewSet)
router.register("activities", ActivityViewSet)

urlpatterns = router.urls
