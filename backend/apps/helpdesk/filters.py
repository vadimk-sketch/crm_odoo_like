import django_filters
from django.utils import timezone

from .models import Ticket


class TicketFilter(django_filters.FilterSet):
    team = django_filters.UUIDFilter(field_name="team_id")
    stage = django_filters.UUIDFilter(field_name="stage_id")
    priority = django_filters.CharFilter(field_name="priority")
    assigned_to = django_filters.UUIDFilter(field_name="assigned_to_id")
    sla_breached = django_filters.BooleanFilter(method="filter_sla_breached")
    is_closed = django_filters.BooleanFilter(field_name="stage__is_closed")
    created_after = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_before = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="lte"
    )

    class Meta:
        model = Ticket
        fields = ["team", "stage", "priority", "assigned_to", "is_closed"]

    def filter_sla_breached(self, queryset, name, value):
        now = timezone.now()
        if value:
            return queryset.filter(
                sla_deadline__lt=now,
                sla_reached=False,
                closed_at__isnull=True,
            )
        return queryset.exclude(
            sla_deadline__lt=now,
            sla_reached=False,
            closed_at__isnull=True,
        )
