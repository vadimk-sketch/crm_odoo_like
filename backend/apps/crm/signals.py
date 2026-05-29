from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import Deal, DealActivity


@receiver(pre_save, sender=Deal)
def deal_stage_change(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        old_deal = Deal.objects.get(pk=instance.pk)
    except Deal.DoesNotExist:
        return

    if old_deal.stage_id == instance.stage_id:
        return

    # Auto-set closed_at when moving to a won or lost stage
    if instance.stage.is_won or instance.stage.is_lost:
        if not instance.closed_at:
            instance.closed_at = timezone.now()
    else:
        instance.closed_at = None

    # Store stage change info so post_save or the view can create the activity.
    # We use a transient attribute; the activity is created here directly because
    # we have the old/new stage info available and the deal already exists.
    instance._stage_changed_from = old_deal.stage_id
    instance._stage_changed_to = instance.stage_id
