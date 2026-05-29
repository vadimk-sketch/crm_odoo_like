from rest_framework.routers import DefaultRouter

from .views import (
    SLAPolicyViewSet,
    SLAViewSet,
    TeamViewSet,
    TicketMessageViewSet,
    TicketStageViewSet,
    TicketViewSet,
)

router = DefaultRouter()
router.register("teams", TeamViewSet)
router.register("ticket-stages", TicketStageViewSet)
router.register("slas", SLAViewSet)
router.register("sla-policies", SLAPolicyViewSet)
router.register("tickets", TicketViewSet)
router.register("ticket-messages", TicketMessageViewSet)

urlpatterns = router.urls
