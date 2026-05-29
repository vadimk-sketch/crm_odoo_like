from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import TicketFilter
from .models import SLA, SLAPolicy, Team, Ticket, TicketMessage, TicketStage
from .serializers import (
    SLAPolicySerializer,
    SLASerializer,
    TeamSerializer,
    TicketAssignSerializer,
    TicketCreateSerializer,
    TicketDetailSerializer,
    TicketListSerializer,
    TicketMessageSerializer,
    TicketMoveSerializer,
    TicketStageSerializer,
)


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.prefetch_related("members").select_related("leader")
    serializer_class = TeamSerializer
    search_fields = ["name"]


class TicketStageViewSet(viewsets.ModelViewSet):
    queryset = TicketStage.objects.select_related("team")
    serializer_class = TicketStageSerializer
    filterset_fields = ["team"]


class SLAViewSet(viewsets.ModelViewSet):
    queryset = SLA.objects.prefetch_related("policies").select_related("team")
    serializer_class = SLASerializer
    filterset_fields = ["team", "is_active"]


class SLAPolicyViewSet(viewsets.ModelViewSet):
    queryset = SLAPolicy.objects.select_related("sla")
    serializer_class = SLAPolicySerializer
    filterset_fields = ["sla", "target_type", "priority"]


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.select_related(
        "team", "stage", "contact", "company", "assigned_to", "sla"
    )
    filterset_class = TicketFilter
    search_fields = ["subject", "reference", "description"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TicketDetailSerializer
        if self.action == "create":
            return TicketCreateSerializer
        if self.action == "assign":
            return TicketAssignSerializer
        if self.action == "move":
            return TicketMoveSerializer
        return TicketListSerializer

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket.assigned_to = serializer.validated_data["assigned_to_id"]
        ticket.save(update_fields=["assigned_to", "updated_at"])
        return Response(TicketDetailSerializer(ticket).data)

    @action(detail=True, methods=["post"])
    def move(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket.stage = serializer.validated_data["stage_id"]
        ticket.save()
        return Response(TicketDetailSerializer(ticket).data)

    @action(detail=True, methods=["get", "post"])
    def messages(self, request, pk=None):
        ticket = self.get_object()
        if request.method == "POST":
            serializer = TicketMessageSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(author=request.user, ticket=ticket)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        serializer = TicketMessageSerializer(ticket.messages.all(), many=True)
        return Response(serializer.data)


class TicketMessageViewSet(viewsets.ModelViewSet):
    queryset = TicketMessage.objects.select_related("author", "ticket")
    serializer_class = TicketMessageSerializer
    filterset_fields = ["ticket", "is_internal"]
    http_method_names = ["get", "post", "head", "options"]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
