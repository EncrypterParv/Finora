"""Normalization engine converting varied inputs into CanonicalTransactionCreate."""

import re
from typing import Tuple
from app.schemas.canonical_transaction import (
    CanonicalTransactionCreate,
    TransactionSource,
    TransactionType,
)
from app.schemas.bank import RawBankTransaction


MERCHANT_RULES = [
    (r"(?i)\b(swiggy|zomato|ubereats|eats)\b", "Food & Dining", "Food Delivery"),
    (r"(?i)\b(starbucks|blue tokai|third wave|costa coffee|cafe coffee day)\b", "Food & Dining", "Coffee"),
    (r"(?i)\b(netflix|spotify|prime video|disney|apple music|youtube)\b", "Entertainment", "Streaming Subscription"),
    (r"(?i)\b(uber|ola|rapido|metro|irctc|indigo|air india)\b", "Transportation", "Transit / Ride"),
    (r"(?i)\b(amazon|flipkart|myntra|ajio|zara|h&m)\b", "Shopping", "E-commerce Retail"),
    (r"(?i)\b(tata power|bescom|airtel|jio|act fibernet|adani gas)\b", "Bills & Utilities", "Utilities"),
    (r"(?i)\b(salary|techcorp|payroll|infosys|tcs|wipro|google|microsoft)\b", "Income", "Salary Payroll"),
    (r"(?i)\b(zerodha|groww|kuvera|indmoney|vanguard)\b", "Investments", "Brokerage / Mutual Funds"),
    (r"(?i)\b(cult\.fit|gym|fitness|anytime fitness)\b", "Health & Fitness", "Fitness"),
]


def resolve_merchant_and_category(raw_description: str) -> Tuple[str, str]:
    """Resolve clean merchant and category from raw bank descriptions."""
    for pattern, cat, merchant_hint in MERCHANT_RULES:
        match = re.search(pattern, raw_description)
        if match:
            matched_text = match.group(0).title()
            return matched_text, cat

    # Fallback to sanitizing raw narration
    cleaned = re.sub(r"[^A-Za-z0-9\s]", " ", raw_description)
    tokens = [t for t in cleaned.split() if len(t) > 2 and not t.isdigit() and t.upper() not in ("UPI", "POS", "ACH", "NEFT", "RTGS", "IMPS", "BILL", "CARD")]
    merchant = " ".join(tokens[:2]).title() if tokens else "Miscellaneous Merchant"
    return merchant, "General"


def normalize_raw_bank_transaction(
    raw: RawBankTransaction,
    account_id: str,
) -> CanonicalTransactionCreate:
    """Transform RawBankTransaction from adapter into CanonicalTransactionCreate."""
    merchant, category = resolve_merchant_and_category(raw.narration)
    
    # If raw already has clean merchant hint, prioritize it
    if raw.merchant_raw and len(raw.merchant_raw) > 2:
        merchant = raw.merchant_raw

    tx_type = TransactionType.DEBIT if raw.is_debit else TransactionType.CREDIT
    if "SALARY" in raw.narration.upper() or not raw.is_debit:
        category = "Income"

    return CanonicalTransactionCreate(
        account_id=account_id,
        occurred_at=raw.occurred_at,
        amount=raw.amount,
        currency=raw.currency,
        transaction_type=tx_type,
        raw_description=raw.narration,
        merchant_name=merchant,
        category_name=category,
        balance_after=raw.balance_after,
        reference_id=raw.reference_number,
        source=TransactionSource.BANK_API,
        metadata=raw.extra_metadata,
    )
