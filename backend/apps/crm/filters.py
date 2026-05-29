import django_filters

from .models import Deal


class DealFilter(django_filters.FilterSet):
    pipeline = django_filters.UUIDFilter(field_name="pipeline_id")
    stage = django_filters.UUIDFilter(field_name="stage_id")
    owner = django_filters.UUIDFilter(field_name="owner_id")
    priority = django_filters.CharFilter(field_name="priority")
    amount_min = django_filters.NumberFilter(field_name="amount", lookup_expr="gte")
    amount_max = django_filters.NumberFilter(field_name="amount", lookup_expr="lte")
    expected_close_date_after = django_filters.DateFilter(
        field_name="expected_close_date", lookup_expr="gte"
    )
    expected_close_date_before = django_filters.DateFilter(
        field_name="expected_close_date", lookup_expr="lte"
    )
    is_closed = django_filters.BooleanFilter(method="filter_is_closed")

    class Meta:
        model = Deal
        fields = [
            "pipeline", "stage", "owner", "priority",
            "amount_min", "amount_max",
            "expected_close_date_after", "expected_close_date_before",
            "is_closed",
        ]

    def filter_is_closed(self, queryset, name, value):
        if value:
            return queryset.filter(closed_at__isnull=False)
        return queryset.filter(closed_at__isnull=True)
