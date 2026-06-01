from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = "Seed 5 VK-TEST examples for every module"

    def handle(self, *args, **options):
        from apps.accounts.models import User
        from apps.contacts.models import Company, Contact, Tag, Note, Activity
        from apps.crm.models import Pipeline, Stage, Deal
        from apps.helpdesk.models import Team, TicketStage, Ticket

        admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            self.stdout.write(self.style.ERROR("No admin user found. Run create_admin first."))
            return

        # --- Tag ---
        tag, _ = Tag.objects.get_or_create(name="VK-TEST", defaults={"color": "#ef4444"})
        self.stdout.write("✓ Tag")

        # --- Companies ---
        company_data = [
            {"name": "VK-TEST Acme Corp", "industry": "Technology", "domain": "acme.com", "city": "San Francisco", "country": "USA"},
            {"name": "VK-TEST GlobalTrade Ltd", "industry": "Finance", "domain": "globaltrade.io", "city": "New York", "country": "USA"},
            {"name": "VK-TEST HealthFirst", "industry": "Healthcare", "domain": "healthfirst.com", "city": "Chicago", "country": "USA"},
            {"name": "VK-TEST BuildRight Inc", "industry": "Construction", "domain": "buildright.com", "city": "Dallas", "country": "USA"},
            {"name": "VK-TEST EduSpark", "industry": "Education", "domain": "eduspark.org", "city": "Boston", "country": "USA"},
        ]
        companies = []
        for d in company_data:
            c, _ = Company.objects.get_or_create(name=d["name"], defaults={**d, "owner": admin, "notes": "VK-TEST sample company"})
            c.tags.add(tag)
            companies.append(c)
        self.stdout.write("✓ Companies (5)")

        # --- Contacts ---
        contact_data = [
            {"first_name": "Alice", "last_name": "VK-TEST Johnson", "email": "alice.vktest@acme.com", "job_title": "CTO", "company": companies[0]},
            {"first_name": "Bob", "last_name": "VK-TEST Smith", "email": "bob.vktest@globaltrade.io", "job_title": "CFO", "company": companies[1]},
            {"first_name": "Carol", "last_name": "VK-TEST Davis", "email": "carol.vktest@healthfirst.com", "job_title": "Director", "company": companies[2]},
            {"first_name": "David", "last_name": "VK-TEST Wilson", "email": "david.vktest@buildright.com", "job_title": "CEO", "company": companies[3]},
            {"first_name": "Emma", "last_name": "VK-TEST Brown", "email": "emma.vktest@eduspark.org", "job_title": "VP Sales", "company": companies[4]},
        ]
        contacts = []
        for d in contact_data:
            c, _ = Contact.objects.get_or_create(
                email=d["email"],
                defaults={**d, "owner": admin, "source": "vk-test", "phone": "+1-555-010-000" + str(len(contacts)+1)}
            )
            c.tags.add(tag)
            contacts.append(c)
        self.stdout.write("✓ Contacts (5)")

        # --- Notes ---
        for i, contact in enumerate(contacts):
            Note.objects.get_or_create(
                contact=contact, author=admin,
                defaults={"content": f"VK-TEST note #{i+1}: Initial discovery call completed. Strong interest in Q1 deal."}
            )
        self.stdout.write("✓ Notes (5)")

        # --- Activities ---
        activity_types = ["call", "email", "meeting", "task", "call"]
        summaries = [
            "VK-TEST: Discovery call scheduled",
            "VK-TEST: Proposal sent via email",
            "VK-TEST: Demo meeting completed",
            "VK-TEST: Follow-up task pending",
            "VK-TEST: Contract review call",
        ]
        for i, contact in enumerate(contacts):
            Activity.objects.get_or_create(
                contact=contact, created_by=admin,
                defaults={
                    "activity_type": activity_types[i],
                    "summary": summaries[i],
                    "due_date": timezone.now() + timedelta(days=i+1),
                    "assigned_to": admin,
                }
            )
        self.stdout.write("✓ Activities (5)")

        # --- CRM Pipeline + Stages ---
        pipeline, _ = Pipeline.objects.get_or_create(
            name="VK-TEST Sales Pipeline",
            defaults={"is_default": True}
        )
        stage_data = [
            ("Lead", 0, False, False),
            ("Qualified", 1, False, False),
            ("Proposal", 2, False, False),
            ("Negotiation", 3, False, False),
            ("Closed Won", 4, True, False),
        ]
        stages = []
        for name, order, is_won, is_lost in stage_data:
            s, _ = Stage.objects.get_or_create(
                pipeline=pipeline, order=order,
                defaults={"name": name, "is_won": is_won, "is_lost": is_lost}
            )
            stages.append(s)
        self.stdout.write("✓ Pipeline + Stages (5)")

        # --- Deals ---
        deal_data = [
            {"name": "VK-TEST: Acme Corp Enterprise License", "amount": "85000.00", "probability": 20, "stage": stages[0], "contact": contacts[0], "company": companies[0]},
            {"name": "VK-TEST: GlobalTrade API Integration", "amount": "42000.00", "probability": 40, "stage": stages[1], "contact": contacts[1], "company": companies[1]},
            {"name": "VK-TEST: HealthFirst Platform", "amount": "120000.00", "probability": 60, "stage": stages[2], "contact": contacts[2], "company": companies[2]},
            {"name": "VK-TEST: BuildRight Mobile App", "amount": "35000.00", "probability": 75, "stage": stages[3], "contact": contacts[3], "company": companies[3]},
            {"name": "VK-TEST: EduSpark Annual Subscription", "amount": "18000.00", "probability": 90, "stage": stages[4], "contact": contacts[4], "company": companies[4]},
        ]
        for d in deal_data:
            Deal.objects.get_or_create(
                name=d["name"],
                defaults={**d, "pipeline": pipeline, "owner": admin,
                          "expected_close_date": (timezone.now() + timedelta(days=30)).date(),
                          "currency": "USD"}
            )
        self.stdout.write("✓ Deals (5)")

        # --- Helpdesk Team + Stages ---
        team, _ = Team.objects.get_or_create(
            name="VK-TEST Support Team",
            defaults={"description": "VK-TEST sample support team", "leader": admin}
        )
        team.members.add(admin)
        ticket_stage_data = [
            ("New", 0, False),
            ("In Progress", 1, False),
            ("Waiting", 2, False),
            ("Resolved", 3, False),
            ("Closed", 4, True),
        ]
        ticket_stages = []
        for name, order, is_closed in ticket_stage_data:
            s, _ = TicketStage.objects.get_or_create(
                team=team, order=order,
                defaults={"name": name, "is_closed": is_closed}
            )
            ticket_stages.append(s)
        self.stdout.write("✓ Helpdesk Team + Stages (5)")

        # --- Tickets ---
        ticket_data = [
            {"subject": "VK-TEST: Login page not loading", "description": "VK-TEST sample ticket. Users report the login page shows a blank screen in Chrome.", "priority": "high", "stage": ticket_stages[0], "contact": contacts[0]},
            {"subject": "VK-TEST: Export to CSV broken", "description": "VK-TEST sample ticket. The CSV export button returns a 500 error.", "priority": "medium", "stage": ticket_stages[1], "contact": contacts[1]},
            {"subject": "VK-TEST: Billing address update", "description": "VK-TEST sample ticket. Customer needs to update billing address for invoices.", "priority": "low", "stage": ticket_stages[2], "contact": contacts[2]},
            {"subject": "VK-TEST: Performance slow on dashboard", "description": "VK-TEST sample ticket. Dashboard takes 8+ seconds to load with large datasets.", "priority": "high", "stage": ticket_stages[3], "contact": contacts[3]},
            {"subject": "VK-TEST: Feature request - dark mode", "description": "VK-TEST sample ticket. Multiple users requesting dark mode support.", "priority": "low", "stage": ticket_stages[4], "contact": contacts[4]},
        ]
        for i, d in enumerate(ticket_data):
            ref = f"VK-{1000+i}"
            Ticket.objects.get_or_create(
                subject=d["subject"],
                defaults={**d, "team": team, "assigned_to": admin,
                          "company": d["contact"].company, "reference": ref}
            )
        self.stdout.write("✓ Tickets (5)")

        self.stdout.write(self.style.SUCCESS(
            "\nAll VK-TEST data seeded! To delete: filter by tag 'VK-TEST' or search 'VK-TEST'."
        ))
