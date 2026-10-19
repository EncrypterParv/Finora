"""Tests for Statement Ingestion and CSV parsing."""

from decimal import Decimal
from app.domain.statement_import.parser import StatementParser
from app.schemas.canonical_transaction import TransactionType


def test_statement_csv_parser():
    csv_data = (
        "Date,Description,Debit,Credit,Balance\n"
        "2026-10-01,ACH SALARY TECHCORP,,125000.00,125000.00\n"
        "2026-10-02,SWIGGY BANGALORE,450.00,,124550.00\n"
        "2026-10-03,NETFLIX SUBSCRIPTION,649.00,,123901.00\n"
    ).encode("utf-8")

    records = StatementParser.parse_csv(csv_data, account_id="acc-csv-test")
    assert len(records) == 3

    # Check first record (Salary)
    salary_tx = records[0]
    assert salary_tx.amount == Decimal("125000.00")
    assert salary_tx.transaction_type == TransactionType.CREDIT
    assert salary_tx.category_name == "Income"

    # Check second record (Swiggy)
    swiggy_tx = records[1]
    assert swiggy_tx.amount == Decimal("450.00")
    assert swiggy_tx.transaction_type == TransactionType.DEBIT
    assert swiggy_tx.merchant_name == "Swiggy"
    assert swiggy_tx.category_name == "Food & Dining"
