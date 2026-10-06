"""Tests for Canonical Transaction normalization and deduplication."""

from datetime import datetime, timezone
from decimal import Decimal
import pytest
from app.domain.statement_import.deduplicator import compute_dedup_hash
from app.domain.statement_import.normalizer import (
    normalize_raw_bank_transaction,
    resolve_merchant_and_category,
)
from app.schemas.bank import RawBankTransaction
from app.schemas.canonical_transaction import TransactionType


def test_dedup_hash_deterministic():
    occurred_at = datetime(2026, 10, 7, 14, 30, 0, tzinfo=timezone.utc)
    amount = Decimal("450.00")
    
    hash1 = compute_dedup_hash("acc-123", occurred_at, amount, "REF-999")
    hash2 = compute_dedup_hash("acc-123", occurred_at, amount, "REF-999")
    hash3 = compute_dedup_hash("acc-123", occurred_at, Decimal("450.01"), "REF-999")

    assert hash1 == hash2
    assert hash1 != hash3
    assert len(hash1) == 64  # SHA256 hex


def test_merchant_and_category_resolution():
    merchant, category = resolve_merchant_and_category("UPI/SWIGGY/ORDER-89102@icici")
    assert merchant == "Swiggy"
    assert category == "Food & Dining"

    merchant, category = resolve_merchant_and_category("ACH SALARY TECHCORP INDIA")
    assert merchant in ("Salary", "Techcorp", "TechCorp")
    assert category == "Income"

    merchant, category = resolve_merchant_and_category("SI NETFLIX SUBSCRIPTION")
    assert merchant == "Netflix"
    assert category == "Entertainment"


def test_normalize_raw_bank_transaction():
    raw = RawBankTransaction(
        raw_id="RAW-101",
        occurred_at=datetime(2026, 10, 5, 18, 45, tzinfo=timezone.utc),
        amount=Decimal("1200.00"),
        currency="INR",
        is_debit=True,
        narration="POS STARBUCKS COFFEE INDIRANAGAR BANGALORE",
        merchant_raw="Starbucks Coffee",
        balance_after=Decimal("45000.00"),
        reference_number="SBX-REF-101",
    )

    canonical = normalize_raw_bank_transaction(raw, "acc-001")
    assert canonical.account_id == "acc-001"
    assert canonical.amount == Decimal("1200.00")
    assert canonical.transaction_type == TransactionType.DEBIT
    assert canonical.merchant_name == "Starbucks Coffee"
    assert canonical.category_name == "Food & Dining"
