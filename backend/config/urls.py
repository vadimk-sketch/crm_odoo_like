from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.core.urls")),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/contacts/", include("apps.contacts.urls")),
    path("api/v1/crm/", include("apps.crm.urls")),
    path("api/v1/helpdesk/", include("apps.helpdesk.urls")),
]
