from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.investments.models import Bid, BidStatus, FundingRound, FundingRoundStatus
from apps.startups.models import Startup
from apps.users.models import UserRole


class InvestmentsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.founder = get_user_model().objects.create_user(
            email="founder@example.com",
            password="secret123",
            first_name="Ada",
            last_name="Lovelace",
            role=UserRole.FOUNDER,
        )
        self.investor = get_user_model().objects.create_user(
            email="investor@example.com",
            password="secret123",
            first_name="Grace",
            last_name="Hopper",
            role=UserRole.INVESTOR,
        )
        self.startup = Startup.objects.create(
            founder=self.founder,
            name="Helio Labs",
            description="A climate-tech startup",
            sector="Climate",
            target_amount=Decimal("100000"),
            equity_offered=Decimal("10"),
        )
        self.funding_round = FundingRound.objects.create(
            startup=self.startup,
            name="Seed Round",
            target_amount=Decimal("100000"),
            minimum_ticket_size=Decimal("1000"),
            maximum_ticket_size=Decimal("25000"),
            status=FundingRoundStatus.OPEN,
        )

    def test_investor_can_create_bid_and_founder_can_accept_it(self):
        self.client.force_authenticate(self.investor)
        response = self.client.post(
            "/api/investments/bids/",
            {
                "funding_round": self.funding_round.id,
                "amount": "5000",
                "equity_requested": "5",
                "message": "Happy to support",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        bid = Bid.objects.get(id=response.data["id"])
        self.assertEqual(bid.status, BidStatus.PENDING)

        self.client.force_authenticate(self.founder)
        response = self.client.patch(
            f"/api/investments/bids/{bid.id}/",
            {"status": BidStatus.ACCEPTED},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        bid.refresh_from_db()
        self.assertEqual(bid.status, BidStatus.ACCEPTED)
