from rest_framework.routers import DefaultRouter

from .views import (
    DealActivityViewSet,
    DealViewSet,
    PipelineViewSet,
    StageViewSet,
)

router = DefaultRouter()
router.register("pipelines", PipelineViewSet, basename="pipeline")
router.register("stages", StageViewSet, basename="stage")
router.register("deals", DealViewSet, basename="deal")
router.register("deal-activities", DealActivityViewSet, basename="deal-activity")

urlpatterns = router.urls
