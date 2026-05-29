from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel


class Team(TimestampedModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name="helpdesk_teams"
    )
    leader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="led_teams",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class TicketStage(TimestampedModel):
    name = models.CharField(max_length=100)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="stages")
    order = models.PositiveIntegerField(default=0)
    is_closed = models.BooleanField(default=False)
    fold_in_kanban = models.BooleanField(default=False)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.name} ({self.team.name})"


class SLA(TimestampedModel):
    name = models.CharField(max_length=100)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="slas")
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "SLA"
        verbose_name_plural = "SLAs"

    def __str__(self):
        return self.name


class SLAPolicy(TimestampedModel):
    class TargetType(models.TextChoices):
        FIRST_RESPONSE = "first_response", "First Response"
        RESOLUTION = "resolution", "Resolution"

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]

    sla = models.ForeignKey(SLA, on_delete=models.CASCADE, related_name="policies")
    target_type = models.CharField(max_length=20, choices=TargetType.choices)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES)
    duration_hours = models.PositiveIntegerField()

    class Meta:
        verbose_name = "SLA policy"
        verbose_name_plural = "SLA policies"
        unique_together = [("sla", "target_type", "priority")]

    def __str__(self):
        return f"{self.sla.name} - {self.get_target_type_display()} ({self.priority})"


class Ticket(TimestampedModel):
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    subject = models.CharField(max_length=255)
    description = models.TextField()
    reference = models.CharField(max_length=20, unique=True, editable=False)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="tickets")
    stage = models.ForeignKey(
        TicketStage, on_delete=models.PROTECT, related_name="tickets"
    )
    contact = models.ForeignKey(
        "contacts.Contact",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets",
    )
    company = models.ForeignKey(
        "contacts.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets",
    )
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.MEDIUM
    )
    sla = models.ForeignKey(
        SLA, on_delete=models.SET_NULL, null=True, blank=True, related_name="tickets"
    )
    sla_deadline = models.DateTimeField(null=True, blank=True)
    sla_reached = models.BooleanField(default=False)
    first_response_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference} - {self.subject}"

    def save(self, *args, **kwargs):
        if not self.reference:
            last = (
                Ticket.objects.order_by("-reference")
                .values_list("reference", flat=True)
                .first()
            )
            if last:
                num = int(last.split("-")[1]) + 1
            else:
                num = 1
            self.reference = f"HD-{num:04d}"
        super().save(*args, **kwargs)


class TicketMessage(TimestampedModel):
    ticket = models.ForeignKey(
        Ticket, on_delete=models.CASCADE, related_name="messages"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ticket_messages"
    )
    body = models.TextField()
    is_internal = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message on {self.ticket.reference} by {self.author}"
