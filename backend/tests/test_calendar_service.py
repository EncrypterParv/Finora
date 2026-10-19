"""Tests for Financial Calendar aggregation service."""

from datetime import date, datetime, timezone
from decimal import Decimal
from app.domain.services.calendar_service import FinancialCalendarService
from app.schemas.calendar import CalendarViewMode


def test_calendar_service_month_aggregation():
    start_date = date(2026, 10, 1)
    end_date = date(2026, 10, 31)

    sample_txs = [
        {
            "id": "tx-1",
            "occurred_at": datetime(2026, 10, 2, 14, 32, tzinfo=timezone.utc),
            "amount": Decimal("450.00"),
            "currency": "INR",
            "transaction_type": "DEBIT",
            "merchant_name": "Ahmed Kumar",
            "category_name": "Personal",
        },
        {
            "id": "tx-2",
            "occurred_at": datetime(2026, 10, 2, 18, 20, tzinfo=timezone.utc),
            "amount": Decimal("850.00"),
            "currency": "INR",
            "transaction_type": "DEBIT",
            "merchant_name": "Electricity",
            "category_name": "Bills & Utilities",
        },
        {
            "id": "tx-3",
            "occurred_at": datetime(2026, 10, 1, 9, 0, tzinfo=timezone.utc),
            "amount": Decimal("125000.00"),
            "currency": "INR",
            "transaction_type": "CREDIT",
            "merchant_name": "TechCorp Payroll",
            "category_name": "Income",
        },
    ]

    cal_view = FinancialCalendarService.build_calendar_view(
        transactions=sample_txs,
        start_date=start_date,
        end_date=end_date,
        mode=CalendarViewMode.MONTH,
    )

    assert cal_view.mode == CalendarViewMode.MONTH
    assert cal_view.total_period_debit == Decimal("1300.00")
    assert cal_view.total_period_credit == Decimal("125000.00")
    assert len(cal_view.days) == 31

    # Oct 2nd checks
    oct_2 = [d for d in cal_view.days if d.date == date(2026, 10, 2)][0]
    assert oct_2.total_debit == Decimal("1300.00")
    assert oct_2.transaction_count == 2
    assert len(oct_2.events) == 2
    assert oct_2.events[0].time_label == "14:32"
    assert oct_2.events[0].merchant_name == "Ahmed Kumar"
    assert oct_2.events[1].time_label == "18:20"
    assert oct_2.events[1].merchant_name == "Electricity"
