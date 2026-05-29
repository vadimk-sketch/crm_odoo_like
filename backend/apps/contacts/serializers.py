from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Activity, Company, Contact, Note, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"


# --- Company ---


class CompanyListSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    owner_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        write_only=True,
        required=False,
        source="tags",
    )
    contact_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            "id", "name", "domain", "industry", "phone", "email",
            "city", "country", "owner", "owner_id", "tags", "tag_ids",
            "contact_count", "created_at",
        ]

    def get_contact_count(self, obj):
        return obj.contacts.count()


class CompanyDetailSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    owner_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        write_only=True,
        required=False,
        source="tags",
    )
    contacts = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = "__all__"

    def get_contacts(self, obj):
        return ContactMinimalSerializer(obj.contacts.all(), many=True).data


# --- Contact ---


class ContactCompanySerializer(serializers.ModelSerializer):
    """Minimal company representation embedded in contact serializers."""

    class Meta:
        model = Company
        fields = ["id", "name"]


class ContactMinimalSerializer(serializers.ModelSerializer):
    """Minimal contact representation embedded in company detail."""
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Contact
        fields = ["id", "full_name", "email", "phone", "job_title"]


class ContactListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    company = ContactCompanySerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    owner = UserSerializer(read_only=True)
    owner_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        write_only=True,
        required=False,
        source="tags",
    )

    class Meta:
        model = Contact
        fields = [
            "id", "full_name", "first_name", "last_name", "email", "phone",
            "job_title", "company", "company_id", "owner", "owner_id",
            "tags", "tag_ids", "source", "created_at",
        ]


class NoteSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Note
        fields = "__all__"
        read_only_fields = ["author"]


class ActivitySerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Activity
        fields = "__all__"
        read_only_fields = ["created_by"]


class ContactDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    company = ContactCompanySerializer(read_only=True)
    company_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    owner = UserSerializer(read_only=True)
    owner_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        write_only=True,
        required=False,
        source="tags",
    )
    notes = NoteSerializer(many=True, read_only=True)
    activities = ActivitySerializer(many=True, read_only=True)

    class Meta:
        model = Contact
        fields = "__all__"
