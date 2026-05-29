import django_filters
from django.db.models import Q

from .models import Company, Contact


class ContactFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    owner = django_filters.UUIDFilter(field_name="owner_id")
    company = django_filters.UUIDFilter(field_name="company_id")
    tags = django_filters.UUIDFilter(field_name="tags__id")
    source = django_filters.CharFilter(field_name="source")
    created_after = django_filters.DateFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Contact
        fields = ["owner", "company", "tags", "source"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(first_name__icontains=value)
            | Q(last_name__icontains=value)
            | Q(email__icontains=value)
        )


class CompanyFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    owner = django_filters.UUIDFilter(field_name="owner_id")
    tags = django_filters.UUIDFilter(field_name="tags__id")
    industry = django_filters.CharFilter(field_name="industry", lookup_expr="iexact")

    class Meta:
        model = Company
        fields = ["owner", "tags", "industry"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value) | Q(domain__icontains=value)
        )
