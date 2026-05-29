from django.conf import settings
from django.core.validators import MaxValueValidator
from django.db import models

from apps.core.models import TimestampedModel


class Pipeline(TimestampedModel):
    name = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_default:
            Pipeline.objects.filter(is_default=True).exclude(pk=self.pk).update(
                is_default=False
            )
        super().save(*args, **kwargs)


class Stage(TimestampedModel):
    name = models.CharField(max_length=100)
    pipeline = models.ForeignKey(
        Pipeline, on_delete=models.CASCADE, related_name="stages"
    )
    order = models.PositiveIntegerField(default=0)
    is_won = models.BooleanField(default=False)
    is_lost = models.BooleanField(default=False)

    class Meta:
        ordering = ["order"]
        unique_together = [("pipeline", "order")]

    def __str__(self):
        return f"{self.pipeline.name} - {self.name}"


class Deal(TimestampedModel):
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    name = models.CharField(max_length=255)
    pipeline = models.ForeignKey(
        Pipeline, on_delete=models.CASCADE, related_name="deals"
    )
    stage = models.ForeignKey(
        Stage, on_delete=models.PROTECT, related_name="deals"
    )
    contact = models.ForeignKey(
        "contacts.Contact",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deals",
    )
    company = models.ForeignKey(
        "contacts.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deals",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_deals",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="USD")
    probability = models.PositiveIntegerField(
        default=0, validators=[MaxValueValidator(100)]
    )
    expected_close_date = models.DateField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.MEDIUM
    )
    description = models.TextField(blank=True)
    tags = models.ManyToManyField(
        "contacts.Tag", blank=True, related_name="deals"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class DealActivity(TimestampedModel):
    class EventType(models.TextChoices):
        STAGE_CHANGE = "stage_change", "Stage Change"
        NOTE = "note", "Note"
        CALL = "call", "Call"
        EMAIL = "email", "Email"
        MEETING = "meeting", "Meeting"

    deal = models.ForeignKey(
        Deal, on_delete=models.CASCADE, related_name="activities"
    )
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    description = models.TextField(blank=True)
    old_stage = models.ForeignKey(
        Stage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    new_stage = models.ForeignKey(
        Stage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE
    )

    class Meta:
        verbose_name_plural = "deal activities"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_event_type_display()} on {self.deal.name}"
