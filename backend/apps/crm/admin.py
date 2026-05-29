from django.contrib import admin

from .models import Deal, DealActivity, Pipeline, Stage


@admin.register(Pipeline)
class PipelineAdmin(admin.ModelAdmin):
    list_display = ["name", "is_default", "created_at"]
    search_fields = ["name"]


class StageInline(admin.TabularInline):
    model = Stage
    extra = 0
    ordering = ["order"]


@admin.register(Stage)
class StageAdmin(admin.ModelAdmin):
    list_display = ["name", "pipeline", "order", "is_won", "is_lost"]
    list_filter = ["pipeline", "is_won", "is_lost"]
    search_fields = ["name"]


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = [
        "name", "pipeline", "stage", "owner", "amount", "currency",
        "priority", "probability", "expected_close_date", "closed_at",
    ]
    list_filter = ["pipeline", "stage", "priority", "currency"]
    search_fields = ["name", "description"]
    raw_id_fields = ["contact", "company", "owner", "pipeline", "stage"]
    date_hierarchy = "created_at"


@admin.register(DealActivity)
class DealActivityAdmin(admin.ModelAdmin):
    list_display = ["deal", "event_type", "created_by", "created_at"]
    list_filter = ["event_type"]
    search_fields = ["description"]
    raw_id_fields = ["deal", "old_stage", "new_stage", "created_by"]
