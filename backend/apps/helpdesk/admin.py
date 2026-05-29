from django.contrib import admin

from .models import SLA, SLAPolicy, Team, Ticket, TicketMessage, TicketStage


class TicketStageInline(admin.TabularInline):
    model = TicketStage
    extra = 0


class SLAPolicyInline(admin.TabularInline):
    model = SLAPolicy
    extra = 0


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ["name", "leader", "created_at"]
    search_fields = ["name"]
    raw_id_fields = ["leader"]
    filter_horizontal = ["members"]
    inlines = [TicketStageInline]


@admin.register(TicketStage)
class TicketStageAdmin(admin.ModelAdmin):
    list_display = ["name", "team", "order", "is_closed", "fold_in_kanban"]
    list_filter = ["team", "is_closed"]


@admin.register(SLA)
class SLAAdmin(admin.ModelAdmin):
    list_display = ["name", "team", "is_active", "created_at"]
    list_filter = ["is_active", "team"]
    inlines = [SLAPolicyInline]


@admin.register(SLAPolicy)
class SLAPolicyAdmin(admin.ModelAdmin):
    list_display = ["sla", "target_type", "priority", "duration_hours"]
    list_filter = ["target_type", "priority"]


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        "reference", "subject", "team", "stage", "priority",
        "assigned_to", "sla_reached", "created_at",
    ]
    search_fields = ["reference", "subject", "description"]
    list_filter = ["priority", "team", "stage", "sla_reached"]
    raw_id_fields = ["contact", "company", "assigned_to", "sla"]
    readonly_fields = ["reference"]


@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = ["ticket", "author", "is_internal", "created_at"]
    list_filter = ["is_internal"]
    raw_id_fields = ["ticket", "author"]
