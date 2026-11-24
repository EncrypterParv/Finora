import pytest
from decimal import Decimal
from app.domain.ml.redactor import redact_pii, redact_transaction, redact_transactions


def test_redact_pii_masks_sensitive_data():
    sample = "Paid 500 to user@example.com, contact +91 9876543210 or call 555-123-4567. Card 4111 2222 3333 4444, Account #123456789012"
    redacted = redact_pii(sample)

    assert "user@example.com" not in redacted
    assert "[EMAIL_MASKED]" in redacted

    assert "9876543210" not in redacted
    assert "555-123-4567" not in redacted
    assert "[PHONE_MASKED]" in redacted

    assert "4111 2222 3333 4444" not in redacted
    assert "[CARD_MASKED]" in redacted

    assert "123456789012" not in redacted
    assert "[ACCOUNT_MASKED]" in redacted


def test_redact_transaction():
    tx = {
        "id": "tx-1",
        "raw_description": "UPI/swiggy/swiggy@icici/9876543210",
        "merchant_name": "Swiggy order 4111222233334444",
        "amount": Decimal("450.00"),
    }
    cleaned = redact_transaction(tx)
    assert "[EMAIL_MASKED]" in cleaned["raw_description"]
    assert "[PHONE_MASKED]" in cleaned["raw_description"]
    assert "[CARD_MASKED]" in cleaned["merchant_name"]
    assert cleaned["amount"] == Decimal("450.00")
