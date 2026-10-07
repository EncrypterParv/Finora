"""Financial Calendar endpoints."""

from datetime import date, datetime, timedelta, timezone
import calendar
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.db.models.user import User
from app.db.models.transaction import Transaction
from app.domain.statement_import.normalizer import resolve_merchant_and_category
from app.domain.services.calendar_service import FinancialCalendarService
from app.schemas.calendar import CalendarViewMode, CalendarViewResponse

router = APIRouter()


@router.get("/view", response_model=CalendarViewResponse)
async def get_calendar_view(
    mode: CalendarViewMode = Query(CalendarViewMode.MONTH, description="Calendar time mode: day, week, month"),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve Financial Calendar grid with time-axis event blocks and spending intensities.
    """
    today = date.today()
    target_year = year or today.year
    target_month = month or today.month

    if mode == CalendarViewMode.MONTH:
        _, last_day = calendar.monthrange(target_year, target_month)
        start_date = date(target_year, target_month, 1)
        end_date = date(target_year, target_month, last_day)
    elif mode == CalendarViewMode.WEEK:
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
    else:  # DAY
        start_date = today
        end_date = today

    # Fetch user transactions in date range
    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = datetime.combine(end_date, datetime.max.time(), tzinfo=timezone.utc)

    query = select(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.occurred_at >= start_dt,
        Transaction.occurred_at <= end_dt,
    )
    result = await db.execute(query)
    tx_models = result.scalars().all()

    tx_dicts = []
    for tx in tx_models:
        merchant, cat = resolve_merchant_and_category(tx.raw_description)
        if hasattr(tx, "merchant_name") and tx.merchant_name and tx.merchant_name != "Merchant":
            merchant = tx.merchant_name
        tx_dicts.append({
            "id": tx.id,
            "occurred_at": tx.occurred_at,
            "amount": tx.amount,
            "currency": tx.currency,
            "transaction_type": tx.transaction_type,
            "merchant_name": merchant,
            "category_name": cat,
        })

    return FinancialCalendarService.build_calendar_view(
        transactions=tx_dicts,
        start_date=start_date,
        end_date=end_date,
        mode=mode,
    )
