import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def check_sla_breaches():
    """Find tickets whose SLA deadline has passed and mark them as breached."""
    from .models import Ticket

    now = timezone.now()
    breached = Ticket.objects.filter(
        sla_deadline__lt=now,
        sla_reached=False,
        closed_at__isnull=True,
    )
    count = breached.update(sla_reached=True)
    if count:
        logger.warning("Marked %d tickets as SLA-breached.", count)
    return count
