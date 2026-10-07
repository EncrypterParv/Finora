"""Concrete HSBC Demo Bank Adapter generating realistic financial streams."""

import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from app.domain.bank_adapters.base import BankAdapter
from app.schemas.bank import InstitutionMetadata, RawBankAccount, RawBankTransaction


class HSBCDemoAdapter(BankAdapter):
    """
    Simulated HSBC Banking Adapter.
    Generates realistic, deterministic financial behaviour data including:
    - Recurring monthly payroll credits
    - Recurring subscriptions (Netflix, Spotify, AWS, Gym)
    - Weekend lifestyle & dining spikes (Swiggy, Zomato, Starbucks)
    - Mid-month utility bills (Electricity, Broadband)
    - UPI transfers & retail shopping
    """

    @property
    def institution_id(self) -> str:
        return "hsbc_demo"

    @property
    def institution_name(self) -> str:
        return "HSBC Bank (Simulated Demo)"

    def get_metadata(self) -> InstitutionMetadata:
        return InstitutionMetadata(
            id=self.institution_id,
            name=self.institution_name,
            logo_url="https://assets.financialcall.local/banks/hsbc.svg",
            is_simulated=True,
            supported_features=["ACCOUNTS", "TRANSACTIONS", "BALANCES", "STREAMING_SIMULATION"],
        )

    async def authenticate(self, session_payload: Dict[str, Any]) -> bool:
        # Simulated authentication always succeeds for demo profiles
        return True

    async def get_accounts(self, session_token: Optional[str] = None) -> List[RawBankAccount]:
        return [
            RawBankAccount(
                account_number_masked="•••• 4892",
                account_type="SAVINGS",
                currency="INR",
                current_balance=Decimal("148500.00"),
                institution_id=self.institution_id,
            ),
            RawBankAccount(
                account_number_masked="•••• 9012",
                account_type="CREDIT",
                currency="INR",
                current_balance=Decimal("23400.00"),
                institution_id=self.institution_id,
            ),
        ]

    async def get_balance(self, account_id: str) -> Decimal:
        return Decimal("148500.00")

    async def get_transactions(
        self,
        account_id: str,
        since: Optional[datetime] = None,
        seed: Optional[str] = "default-demo",
    ) -> List[RawBankTransaction]:
        now = datetime.now(timezone.utc)
        if since is None:
            since = now - timedelta(days=60)
        elif since.tzinfo is None:
            since = since.replace(tzinfo=timezone.utc)

        # Deterministic pseudo-random generation based on seed
        rng = random.Random(seed)
        transactions: List[RawBankTransaction] = []
        current_balance = Decimal("148500.00")
        
        # 1. Monthly Salaries (1st of month)
        curr_date = since
        tx_counter = 1000

        while curr_date <= now:
            # 1st of month salary
            if curr_date.day == 1:
                tx_counter += 1
                transactions.append(
                    RawBankTransaction(
                        raw_id=f"HSBC-TXN-{tx_counter}",
                        occurred_at=curr_date.replace(hour=9, minute=15),
                        amount=Decimal("125000.00"),
                        currency="INR",
                        is_debit=False,
                        narration="ACH CREDIT SALARY TECH CORP INDIA PVT LTD",
                        merchant_raw="TechCorp India Payroll",
                        balance_after=current_balance + Decimal("125000.00"),
                        reference_number=f"NEFT-HSBC-SAL-{curr_date.strftime('%Y%m')}",
                        extra_metadata={"source": "HSBC_API", "channel": "NEFT"},
                    )
                )

            # Subscriptions on 5th
            if curr_date.day == 5:
                tx_counter += 1
                transactions.append(
                    RawBankTransaction(
                        raw_id=f"HSBC-TXN-{tx_counter}",
                        occurred_at=curr_date.replace(hour=4, minute=30),
                        amount=Decimal("649.00"),
                        currency="INR",
                        is_debit=True,
                        narration="SI NETFLIX ENTERTAINMENT SERVICES IN",
                        merchant_raw="Netflix",
                        balance_after=current_balance - Decimal("649.00"),
                        reference_number=f"SI-NFLX-{curr_date.strftime('%Y%m')}",
                        extra_metadata={"category_hint": "Entertainment"},
                    )
                )

            # Utility bill on 12th
            if curr_date.day == 12:
                tx_counter += 1
                transactions.append(
                    RawBankTransaction(
                        raw_id=f"HSBC-TXN-{tx_counter}",
                        occurred_at=curr_date.replace(hour=18, minute=20),
                        amount=Decimal("2450.00"),
                        currency="INR",
                        is_debit=True,
                        narration="BBPS ELECTRICITY BILL TATA POWER MUMBAI",
                        merchant_raw="Tata Power",
                        balance_after=current_balance - Decimal("2450.00"),
                        reference_number=f"BBPS-ELE-{curr_date.strftime('%Y%m')}",
                        extra_metadata={"category_hint": "Bills"},
                    )
                )

            # Daily/Weekly lifestyle transactions
            weekday = curr_date.weekday()
            # Weekday lunch / coffee
            if weekday < 5 and rng.random() > 0.4:
                tx_counter += 1
                cost = Decimal(str(rng.randint(250, 650)))
                transactions.append(
                    RawBankTransaction(
                        raw_id=f"HSBC-TXN-{tx_counter}",
                        occurred_at=curr_date.replace(hour=rng.randint(12, 14), minute=rng.randint(10, 50)),
                        amount=cost,
                        currency="INR",
                        is_debit=True,
                        narration=f"UPI/SWIGGY/ORDER-{rng.randint(10000, 99999)}@icici",
                        merchant_raw="Swiggy",
                        balance_after=current_balance - cost,
                        reference_number=f"UPI-SWG-{tx_counter}",
                    )
                )

            # Weekend dining & entertainment spike
            if weekday in (5, 6) and rng.random() > 0.3:
                tx_counter += 1
                cost = Decimal(str(rng.randint(1200, 3800)))
                transactions.append(
                    RawBankTransaction(
                        raw_id=f"HSBC-TXN-{tx_counter}",
                        occurred_at=curr_date.replace(hour=rng.randint(19, 22), minute=rng.randint(10, 50)),
                        amount=cost,
                        currency="INR",
                        is_debit=True,
                        narration=f"POS DINING RESTAURANT BANGALORE IN",
                        merchant_raw="Toit Brewpub",
                        balance_after=current_balance - cost,
                        reference_number=f"POS-DIN-{tx_counter}",
                    )
                )

            curr_date += timedelta(days=1)

        return sorted(transactions, key=lambda x: x.occurred_at, reverse=True)
