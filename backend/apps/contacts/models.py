from django.conf import settings
from django.db import models

from apps.core.models import TimestampedModel


class Tag(TimestampedModel):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default="#6366f1")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Company(TimestampedModel):
    name = models.CharField(max_length=255)
    domain = models.CharField(max_length=255, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_companies",
    )
    tags = models.ManyToManyField("Tag", blank=True, related_name="companies")

    class Meta:
        verbose_name_plural = "companies"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Contact(TimestampedModel):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    mobile = models.CharField(max_length=20, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    company = models.ForeignKey(
        Company,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contacts",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_contacts",
    )
    tags = models.ManyToManyField("Tag", blank=True, related_name="contacts")
    source = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.full_name

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class Note(TimestampedModel):
    content = models.TextField()
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notes",
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notes",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="authored_notes",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Note by {self.author} on {self.created_at:%Y-%m-%d}"


class Activity(TimestampedModel):
    class ActivityType(models.TextChoices):
        CALL = "call", "Call"
        EMAIL = "email", "Email"
        MEETING = "meeting", "Meeting"
        TASK = "task", "Task"
        NOTE = "note", "Note"

    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    summary = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    is_done = models.BooleanField(default=False)
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="activities",
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="activities",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assigned_activities",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_activities",
    )

    class Meta:
        verbose_name_plural = "activities"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_activity_type_display()}: {self.summary}"
