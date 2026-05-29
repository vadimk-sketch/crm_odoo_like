from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import SLA, SLAPolicy, Team, Ticket, TicketMessage, TicketStage

User = get_user_model()


# --- Nested / Minimal ---


class TeamMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name"]


class StageMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketStage
        fields = ["id", "name"]


# --- SLA ---


class SLAPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = SLAPolicy
        fields = [
            "id", "sla", "target_type", "priority",
            "duration_hours", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SLASerializer(serializers.ModelSerializer):
    policies = SLAPolicySerializer(many=True, read_only=True)

    class Meta:
        model = SLA
        fields = [
            "id", "name", "team", "is_active",
            "policies", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# --- Team ---


class TeamSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    member_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        source="members",
    )
    leader = UserSerializer(read_only=True)
    leader_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    ticket_count = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            "id", "name", "description", "members", "member_ids",
            "leader", "leader_id", "ticket_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_ticket_count(self, obj):
        return obj.tickets.count()


# --- TicketStage ---


class TicketStageSerializer(serializers.ModelSerializer):
    ticket_count = serializers.SerializerMethodField()

    class Meta:
        model = TicketStage
        fields = [
            "id", "name", "team", "order", "is_closed",
            "fold_in_kanban", "ticket_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_ticket_count(self, obj):
        return obj.tickets.count()


# --- Ticket ---


class TicketMessageSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = TicketMessage
        fields = [
            "id", "ticket", "author", "body",
            "is_internal", "created_at",
        ]
        read_only_fields = ["id", "author", "created_at"]


class TicketListSerializer(serializers.ModelSerializer):
    team = TeamMinimalSerializer(read_only=True)
    stage = StageMinimalSerializer(read_only=True)
    contact = serializers.SerializerMethodField()
    company = serializers.SerializerMethodField()
    assigned_to = UserSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id", "subject", "reference", "team",
            "stage", "contact", "company",
            "assigned_to", "priority",
            "sla_deadline", "sla_reached", "created_at",
        ]

    def get_contact(self, obj):
        if obj.contact:
            return {"id": str(obj.contact.id), "name": str(obj.contact)}
        return None

    def get_company(self, obj):
        if obj.company:
            return {"id": str(obj.company.id), "name": obj.company.name}
        return None


class TicketDetailSerializer(serializers.ModelSerializer):
    team = TeamMinimalSerializer(read_only=True)
    stage = StageMinimalSerializer(read_only=True)
    contact = serializers.SerializerMethodField()
    company = serializers.SerializerMethodField()
    assigned_to = UserSerializer(read_only=True)
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id", "subject", "description", "reference",
            "team", "stage",
            "contact", "company", "assigned_to",
            "priority", "sla", "sla_deadline", "sla_reached",
            "first_response_at", "resolved_at", "closed_at",
            "messages", "created_at", "updated_at",
        ]

    def get_contact(self, obj):
        if obj.contact:
            return {"id": str(obj.contact.id), "name": str(obj.contact)}
        return None

    def get_company(self, obj):
        if obj.company:
            return {"id": str(obj.company.id), "name": obj.company.name}
        return None


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            "id", "subject", "description", "team", "stage",
            "contact", "company", "assigned_to", "priority",
        ]
        read_only_fields = ["id"]


class TicketAssignSerializer(serializers.Serializer):
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True
    )


class TicketMoveSerializer(serializers.Serializer):
    stage_id = serializers.PrimaryKeyRelatedField(
        queryset=TicketStage.objects.all()
    )
