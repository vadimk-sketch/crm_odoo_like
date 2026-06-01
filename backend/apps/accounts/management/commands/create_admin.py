from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = "Create initial admin user"

    def add_arguments(self, parser):
        parser.add_argument("--email", default="admin@crm.com")
        parser.add_argument("--password", default="Admin1234!")
        parser.add_argument("--username", default="admin")

    def handle(self, *args, **options):
        email = options["email"]
        if User.objects.filter(email=email).exists():
            self.stdout.write(f"User {email} already exists")
            return
        user = User.objects.create_superuser(
            email=email,
            username=options["username"],
            password=options["password"],
            first_name="Admin",
        )
        self.stdout.write(self.style.SUCCESS(f"Created: {user.email}"))
