from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import CompanyFilter, ContactFilter
from .models import Activity, Company, Contact, Note, Tag
from .serializers import (
    ActivitySerializer,
    CompanyDetailSerializer,
    CompanyListSerializer,
    ContactDetailSerializer,
    ContactListSerializer,
    NoteSerializer,
    TagSerializer,
)


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    search_fields = ["name"]


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.select_related("owner").prefetch_related("tags")
    filterset_class = CompanyFilter
    search_fields = ["name", "domain", "email"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CompanyDetailSerializer
        return CompanyListSerializer


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.select_related("company", "owner").prefetch_related("tags")
    filterset_class = ContactFilter
    search_fields = ["first_name", "last_name", "email", "phone"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ContactDetailSerializer
        return ContactListSerializer

    @action(detail=True, methods=["get", "post"])
    def notes(self, request, pk=None):
        contact = self.get_object()
        if request.method == "POST":
            serializer = NoteSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(author=request.user, contact=contact)
            return Response(serializer.data, status=201)
        serializer = NoteSerializer(contact.notes.all(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get", "post"])
    def activities(self, request, pk=None):
        contact = self.get_object()
        if request.method == "POST":
            serializer = ActivitySerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(created_by=request.user, contact=contact)
            return Response(serializer.data, status=201)
        serializer = ActivitySerializer(contact.activities.all(), many=True)
        return Response(serializer.data)


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.select_related("author", "contact", "company")
    serializer_class = NoteSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.select_related(
        "contact", "company", "assigned_to", "created_by"
    )
    serializer_class = ActivitySerializer
    filterset_fields = ["is_done", "activity_type", "assigned_to"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
