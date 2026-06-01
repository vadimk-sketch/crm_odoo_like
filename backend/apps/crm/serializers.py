from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Deal, DealActivity, Pipeline, Stage


# --- Minimal nested serializers ---


class StageMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stage
        fields = ["id", "name"]


class ContactMinimalSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    full_name = serializers.CharField(read_only=True)


class CompanyMinimalSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField(read_only=True)


# --- Stage ---


class StageSerializer(serializers.ModelSerializer):
    deal_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Stage
        fields = [
            "id", "name", "pipeline", "order", "is_won", "is_lost",
            "deal_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# --- Pipeline ---


class PipelineSerializer(serializers.ModelSerializer):
    stages = StageSerializer(many=True, read_only=True)

    class Meta:
        model = Pipeline
        fields = [
            "id", "name", "is_default", "stages", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# --- DealActivity ---


class DealActivitySerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    old_stage = StageMinimalSerializer(read_only=True)
    new_stage = StageMinimalSerializer(read_only=True)

    class Meta:
        model = DealActivity
        fields = [
            "id", "deal", "event_type", "description",
            "old_stage", "new_stage", "created_by",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "deal", "old_stage", "new_stage", "created_at", "updated_at"]


# --- Deal ---


class DealListSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    owner_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    contact = ContactMinimalSerializer(read_only=True)
    contact_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    company = CompanyMinimalSerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    stage = StageMinimalSerializer(read_only=True)
    stage_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Deal
        fields = [
            "id", "name", "pipeline", "stage", "stage_id",
            "contact", "contact_id", "company", "company_id",
            "owner", "owner_id", "amount", "currency",
            "probability", "expected_close_date", "closed_at",
            "priority", "created_at",
        ]
        read_only_fields = ["id", "closed_at", "created_at"]


class DealDetailSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    owner_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    contact = ContactMinimalSerializer(read_only=True)
    contact_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    company = CompanyMinimalSerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    stage = StageMinimalSerializer(read_only=True)
    stage_id = serializers.UUIDField(write_only=True)
    tags = serializers.SerializerMethodField()
    activities = DealActivitySerializer(many=True, read_only=True)

    class Meta:
        model = Deal
        fields = [
            "id", "name", "pipeline", "stage", "stage_id",
            "contact", "contact_id", "company", "company_id",
            "owner", "owner_id", "amount", "currency",
            "probability", "expected_close_date", "closed_at",
            "priority", "description", "tags",
            "activities", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "closed_at", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.contacts.models import Tag
        self.fields["tag_ids"] = serializers.PrimaryKeyRelatedField(
            many=True,
            queryset=Tag.objects.all(),
            write_only=True,
            required=False,
            source="tags",
        )

    def get_tags(self, obj):
        from apps.contacts.serializers import TagSerializer
        return TagSerializer(obj.tags.all(), many=True).data


# --- Move action ---


class DealMoveSerializer(serializers.Serializer):
    new_stage_id = serializers.UUIDField()

    def validate_new_stage_id(self, value):
        try:
            Stage.objects.get(pk=value)
        except Stage.DoesNotExist:
            raise serializers.ValidationError("Stage not found.")
        return value
