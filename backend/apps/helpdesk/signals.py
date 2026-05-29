from datetime import timedelta

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import SLAPolicy, Ticket


@receiver(pre_save, sender=Ticket)
def set_closed_timestamps(sender, instance, **kwargs):
    """When a ticket moves to a closed stage, set closed_at and resolved_at."""
    if instance.stage_id and instance.stage.is_closed:
        now = timezone.now()
        if instance.closed_at is None:
            instance.closed_at = now
        if instance.resolved_at is None:
            instance.resolved_at = now


@receiver(post_save, sender=Ticket)
def compute_sla_deadline(sender, instance, created, **kwargs):
    """On ticket creation, compute SLA deadline from active team SLA policies."""
    if not created:
        return

    sla = instance.team.slas.filter(is_active=True).first()
    if not sla:
        return

    policy = sla.policies.filter(
        target_type=SLAPolicy.TargetType.FIRST_RESPONSE,
        priority=instance.priority,
    ).first()
    if not policy:
        return

    deadline = instance.created_at + timedelta(hours=policy.duration_hours)
    # Use update to avoid triggering save signals again
    Ticket.objects.filter(pk=instance.pk).update(
        sla=sla, sla_deadline=deadline
    )
