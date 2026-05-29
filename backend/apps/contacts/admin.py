from django.contrib import admin

from .models import Activity, Company, Contact, Note, Tag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "color", "created_at"]
    search_fields = ["name"]


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ["name", "domain", "industry", "phone", "email", "city", "country", "owner"]
    search_fields = ["name", "domain", "email"]
    list_filter = ["industry", "country"]
    raw_id_fields = ["owner"]


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ["first_name", "last_name", "email", "phone", "job_title", "company", "owner"]
    search_fields = ["first_name", "last_name", "email", "phone"]
    list_filter = ["source", "company"]
    raw_id_fields = ["owner", "company"]


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ["__str__", "contact", "company", "author", "created_at"]
    search_fields = ["content"]
    raw_id_fields = ["author", "contact", "company"]


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ["summary", "activity_type", "is_done", "due_date", "contact", "company", "assigned_to"]
    search_fields = ["summary", "description"]
    list_filter = ["activity_type", "is_done"]
    raw_id_fields = ["contact", "company", "assigned_to", "created_by"]
