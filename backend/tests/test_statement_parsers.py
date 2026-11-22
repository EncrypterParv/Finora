"""Tests for Statement Ingestion and CSV parsing."""

from decimal import Decimal
import pytest
from app.domain.statement_import.parser import StatementParser
from app.domain.statement_import.document_reader import (
    StatementReadError,
    read_statement,
    validate_statement_file,
)
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


def test_parser_does_not_mistake_address_column_for_debit():
    data = (
        "Date,Description,Address,Amount,Type\n"
        "2026-10-04,Transfer to savings,12 Main Road,2500,CR\n"
    ).encode()
    records = StatementParser.parse_csv(data, account_id="acc-test")
    assert len(records) == 1
    assert records[0].amount == Decimal("2500")
    assert records[0].transaction_type == TransactionType.CREDIT


def test_parser_reports_malformed_transaction_rows_instead_of_silently_dropping():
    data = (
        "Date,Description,Debit,Credit\n"
        "2026-10-01,Groceries,not-a-number,\n"
    ).encode()
    with pytest.raises(ValueError, match="transaction row"):
        StatementParser.parse_csv(data, account_id="acc-test")


def test_statement_preview_csv_requires_review_and_limits_supported_types():
    data = b"Date,Description,Amount,Type\n2026-10-01,Coffee,80,Debit\n"
    result = read_statement(data, "statement.csv", "acc-test")
    assert result.needs_review is True
    assert result.format == "csv"
    assert len(result.records) == 1


def test_parser_rejects_amount_column_without_transaction_direction():
    data = b"Date,Description,Amount\n2026-10-01,Transfer,80\n"
    with pytest.raises(ValueError, match="no debit/credit direction"):
        StatementParser.parse_csv(data, account_id="acc-test")

    with pytest.raises(StatementReadError, match="contents do not match"):
        validate_statement_file("statement.pdf", data)


def test_statement_reader_rejects_empty_or_unsupported_files():
    with pytest.raises(StatementReadError, match="empty"):
        validate_statement_file("statement.csv", b"")
    with pytest.raises(StatementReadError, match="Choose a CSV"):
        validate_statement_file("statement.xlsx", b"not a spreadsheet")
