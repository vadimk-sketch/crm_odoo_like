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
            {
                "name": "VK-TEST: Acme Corp Enterprise License",
                "amount": "85000.00", "probability": 20, "priority": "high",
                "stage": stages[0], "contact": contacts[0], "company": companies[0],
                "description": "VK-TEST: Full enterprise license for 500 seats. Includes onboarding, dedicated support, and custom integrations. Decision maker is Alice Johnson (CTO).",
                "expected_close_date": (timezone.now() + timedelta(days=60)).date(),
            },
            {
                "name": "VK-TEST: GlobalTrade API Integration",
                "amount": "42000.00", "probability": 40, "priority": "medium",
                "stage": stages[1], "contact": contacts[1], "company": companies[1],
                "description": "VK-TEST: Custom API integration with GlobalTrade's existing ERP system. 3-month implementation timeline. SOW sent on June 1.",
                "expected_close_date": (timezone.now() + timedelta(days=45)).date(),
            },
            {
                "name": "VK-TEST: HealthFirst Platform",
                "amount": "120000.00", "probability": 60, "priority": "high",
                "stage": stages[2], "contact": contacts[2], "company": companies[2],
                "description": "VK-TEST: Full platform deployment for HealthFirst. HIPAA-compliant environment required. Proposal sent, awaiting legal review from their compliance team.",
                "expected_close_date": (timezone.now() + timedelta(days=30)).date(),
            },
            {
                "name": "VK-TEST: BuildRight Mobile App",
                "amount": "35000.00", "probability": 75, "priority": "medium",
                "stage": stages[3], "contact": contacts[3], "company": companies[3],
                "description": "VK-TEST: iOS and Android app for field workers. GPS tracking, photo upload, job scheduling. Final negotiation on payment terms - NET 60 requested.",
                "expected_close_date": (timezone.now() + timedelta(days=14)).date(),
            },
            {
                "name": "VK-TEST: EduSpark Annual Subscription",
                "amount": "18000.00", "probability": 90, "priority": "low",
                "stage": stages[4], "contact": contacts[4], "company": companies[4],
                "description": "VK-TEST: Annual SaaS subscription renewal. 200 teacher licenses + admin dashboard. PO issued, awaiting final signature from VP Emma Brown.",
                "expected_close_date": (timezone.now() + timedelta(days=7)).date(),
            },
        ]
        for d in deal_data:
            obj, created = Deal.objects.get_or_create(
                name=d["name"],
                defaults={**d, "pipeline": pipeline, "owner": admin, "currency": "USD"}
            )
            if not created:
                for k, v in d.items():
                    setattr(obj, k, v)
                obj.pipeline = pipeline
                obj.owner = admin
                obj.currency = "USD"
                obj.save()
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
            {
                "subject": "VK-TEST: Login page not loading on Chrome v124",
                "description": "VK-TEST: Reported by Alice Johnson at Acme Corp. Users on Chrome v124+ see a blank white screen after entering credentials. Firefox works fine. Affects ~30 users. Priority escalated by account manager.",
                "priority": "urgent", "stage": ticket_stages[0], "contact": contacts[0],
            },
            {
                "subject": "VK-TEST: CSV export returns 500 error",
                "description": "VK-TEST: Reported by Bob Smith at GlobalTrade. Exporting deals list to CSV consistently fails with HTTP 500. Worked 2 weeks ago. Last code deploy was June 1. Logs show a memory overflow on large datasets (>10k rows).",
                "priority": "high", "stage": ticket_stages[1], "contact": contacts[1],
            },
            {
                "subject": "VK-TEST: Update billing address for Q2 invoices",
                "description": "VK-TEST: Carol Davis from HealthFirst needs to update their billing address from 123 Main St to 456 Oak Ave, Chicago IL 60601, before the Q2 invoice run on June 15. Tax ID also needs updating.",
                "priority": "medium", "stage": ticket_stages[2], "contact": contacts[2],
            },
            {
                "subject": "VK-TEST: Dashboard loads in 8+ seconds",
                "description": "VK-TEST: David Wilson at BuildRight reports the main dashboard takes 8-12 seconds to fully render with their dataset (5,000 records). Memory profiling shows N+1 query on the activity timeline widget. Fix in progress.",
                "priority": "high", "stage": ticket_stages[3], "contact": contacts[3],
            },
            {
                "subject": "VK-TEST: Dark mode support request",
                "description": "VK-TEST: Emma Brown at EduSpark submitted this on behalf of 47 teachers in their org who prefer dark mode for evening use. This is a low-priority UX enhancement tracked for Q3 roadmap.",
                "priority": "low", "stage": ticket_stages[4], "contact": contacts[4],
            },
        ]
        for i, d in enumerate(ticket_data):
            ref = f"VK-{1000+i}"
            obj, created = Ticket.objects.get_or_create(
                reference=ref,
                defaults={**d, "team": team, "assigned_to": admin,
                          "company": d["contact"].company, "subject": d["subject"]}
            )
            if not created:
                obj.subject = d["subject"]
                obj.description = d["description"]
                obj.priority = d["priority"]
                obj.stage = d["stage"]
                obj.save()
        self.stdout.write("✓ Tickets (5)")

        self.stdout.write(self.style.SUCCESS(
            "\nAll VK-TEST data seeded! To delete: filter by tag 'VK-TEST' or search 'VK-TEST'."
        ))
