from django.db.models import Count, Q, Sum
from rest_framework import serializers as drf_serializers
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import DealFilter
from .models import Deal, DealActivity, Pipeline, Stage
from .serializers import (
    DealActivitySerializer,
    DealDetailSerializer,
    DealListSerializer,
    DealMoveSerializer,
    PipelineSerializer,
    StageSerializer,
)


class PipelineViewSet(viewsets.ModelViewSet):
    serializer_class = PipelineSerializer
    search_fields = ["name"]

    def get_queryset(self):
        return Pipeline.objects.prefetch_related(
            "stages"
        ).all().prefetch_related(
            # Annotate deal_count on each stage for the nested serializer
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        return ctx

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        # Manually annotate stages with deal counts for the nested serializer
        pipelines = list(queryset)
        stage_ids = []
        for p in pipelines:
            stage_ids.extend(p.stages.values_list("id", flat=True))

        deal_counts = dict(
            Deal.objects.filter(stage_id__in=stage_ids)
            .values_list("stage_id")
            .annotate(count=Count("id"))
            .values_list("stage_id", "count")
        )

        # Inject deal_count into each stage before serialization
        for p in pipelines:
            for s in p.stages.all():
                s.deal_count = deal_counts.get(s.id, 0)

        serializer = self.get_serializer(pipelines, many=True)
        return Response(serializer.data)


class StageViewSet(viewsets.ModelViewSet):
    serializer_class = StageSerializer
    search_fields = ["name"]
    filterset_fields = ["pipeline"]

    def get_queryset(self):
        return Stage.objects.annotate(deal_count=Count("deals"))

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        items = request.data
        if not isinstance(items, list):
            raise drf_serializers.ValidationError(
                "Expected a list of {id, order} objects."
            )

        stages = Stage.objects.filter(
            id__in=[item["id"] for item in items]
        )
        stage_map = {str(s.id): s for s in stages}

        updated = []
        for item in items:
            stage = stage_map.get(str(item["id"]))
            if stage and stage.order != item["order"]:
                stage.order = item["order"]
                updated.append(stage)

        if updated:
            Stage.objects.bulk_update(updated, ["order"])

        return Response({"status": "ok"})


class DealViewSet(viewsets.ModelViewSet):
    filterset_class = DealFilter
    search_fields = ["name", "description"]

    def get_queryset(self):
        return Deal.objects.select_related(
            "pipeline", "stage", "contact", "company", "owner"
        ).prefetch_related("tags", "activities")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return DealDetailSerializer
        if self.action == "move":
            return DealMoveSerializer
        return DealListSerializer

    @action(detail=True, methods=["post"])
    def move(self, request, pk=None):
        deal = self.get_object()
        serializer = DealMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_stage = Stage.objects.get(pk=serializer.validated_data["new_stage_id"])
        old_stage = deal.stage

        deal.stage = new_stage
        deal.save()  # Signal handles closed_at and sets transient attrs

        # Create stage-change activity
        DealActivity.objects.create(
            deal=deal,
            event_type=DealActivity.EventType.STAGE_CHANGE,
            description=f"Moved from {old_stage.name} to {new_stage.name}",
            old_stage=old_stage,
            new_stage=new_stage,
            created_by=request.user,
        )

        return Response(DealDetailSerializer(deal).data)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        qs = self.filter_queryset(self.get_queryset())
        total_deals = qs.count()
        total_value = qs.aggregate(total=Sum("amount"))["total"] or 0

        value_per_stage = list(
            qs.values("stage__id", "stage__name")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("stage__name")
        )

        won_count = qs.filter(stage__is_won=True).count()
        closed_count = qs.filter(closed_at__isnull=False).count()
        win_rate = round(won_count / closed_count * 100, 1) if closed_count else 0

        return Response({
            "total_deals": total_deals,
            "total_value": str(total_value),
            "win_rate": win_rate,
            "value_per_stage": value_per_stage,
        })


class DealActivityViewSet(viewsets.ModelViewSet):
    serializer_class = DealActivitySerializer
    http_method_names = ["get", "post", "head", "options"]
    filterset_fields = ["deal", "event_type"]

    def get_queryset(self):
        return DealActivity.objects.select_related(
            "deal", "old_stage", "new_stage", "created_by"
        )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
