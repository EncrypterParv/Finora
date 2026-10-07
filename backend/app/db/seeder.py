"""Database initial demo seeder."""

from datetime import date, datetime, timezone
from decimal import Decimal
import logging
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models.user import User
from app.db.models.account import BankAccount
from app.db.models.budget import Budget
from app.db.models.goal import FinancialGoal
from app.db.models.transaction import Transaction
from app.domain.bank_adapters.hsbc_demo import HSBCDemoAdapter
from app.domain.statement_import.deduplicator import compute_dedup_hash
from app.domain.statement_import.normalizer import normalize_raw_bank_transaction

logger = logging.getLogger("financialcall.seeder")


async def seed_demo_data_if_empty(db: AsyncSession) -> None:
    """Seed initial demo user, account, budget, goal, and transactions if database is empty."""
    user_res = await db.execute(select(User).limit(1))
    existing_user = user_res.scalars().first()

    if existing_user:
        return  # Database already seeded

    # 1. Create Demo User
    demo_user = User(
        id="user-1",
        email="demo@financialcall.ai",
        full_name="Yash Srivastava",
        hashed_password="demo_bcrypt_hash_placeholder",
        currency="INR",
        preferences={"plan_tier": "INDIVIDUAL_PRO", "theme": "dark"},
    )
    db.add(demo_user)

    # 2. Create Bank Account
    demo_account = BankAccount(
        id="acc-1",
        user_id="user-1",
        institution_name="HSBC Premier Savings",
        account_number_masked="•••• 4821",
        account_type="SAVINGS",
        current_balance=Decimal("148500.00"),
        currency="INR",
        adapter_type="HSBC_DEMO",
        last_synced_at=datetime.now(timezone.utc),
    )
    db.add(demo_account)

    # 3. Create Budget
    demo_budget = Budget(
        id="budget-1",
        user_id="user-1",
        name="Monthly Discretionary & Core Budget",
        period="MONTHLY",
        total_limit=Decimal("50000.00"),
        start_date=date(2026, 10, 1),
        end_date=date(2026, 10, 31),
    )
    db.add(demo_budget)

    # 4. Create Financial Goal
    demo_goal = FinancialGoal(
        id="goal-1",
        user_id="user-1",
        title="Financial Independence (FIRE)",
        goal_type="RETIREMENT",
        target_amount=Decimal("2500000.00"),
        current_saved=Decimal("420000.00"),
        monthly_contribution=Decimal("18000.00"),
        target_date=date(2033, 10, 31),
        expected_annual_return_pct=Decimal("12.0"),
        status="IN_PROGRESS",
    )
    db.add(demo_goal)

    # 5. Populate initial realistic transactions via HSBC adapter
    adapter = HSBCDemoAdapter()
    raw_txs = await adapter.get_transactions(
        account_id="acc-1",
        since=datetime(2026, 9, 1, tzinfo=timezone.utc),
        seed="financialcall-seed-oct2026",
    )

    for raw in raw_txs:
        canonical_in = normalize_raw_bank_transaction(raw, "acc-1")
        dedup_hash = compute_dedup_hash(
            account_id="acc-1",
            occurred_at=canonical_in.occurred_at,
            amount=canonical_in.amount,
            reference_id=canonical_in.reference_id,
        )

        tx = Transaction(
            id=str(uuid.uuid4()),
            user_id="user-1",
            account_id="acc-1",
            occurred_at=canonical_in.occurred_at,
            amount=canonical_in.amount,
            currency=canonical_in.currency,
            transaction_type=canonical_in.transaction_type.value,
            raw_description=canonical_in.raw_description,
            balance_after=canonical_in.balance_after,
            reference_id=canonical_in.reference_id,
            source=canonical_in.source.value,
            dedup_hash=dedup_hash,
            metadata_=canonical_in.metadata or {},
        )
        db.add(tx)

    await db.commit()
    logger.info("Database initialized and seeded with demo profile.")
