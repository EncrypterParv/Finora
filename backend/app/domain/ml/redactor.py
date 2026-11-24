"""Pure-Python PII Redaction module for Finora analytics.

Strips credit card numbers, bank account numbers, phone numbers, and email
addresses from financial text and transaction logs before processing or logging.
"""

import re
from typing import Any, Dict, List

# Regex patterns for PII scrubbing
ACCOUNT_PATTERN = re.compile(r"(?:A/C|ACC|ACCT|ACCOUNT)[\s:#]*([0-9Xx*]{6,18})\b", re.IGNORECASE)
CARD_PATTERN = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\b")
PHONE_PATTERN = re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")


def redact_pii(text: str) -> str:
    """Scrub card numbers, account digits, emails, and phone numbers from text."""
    if not text:
        return ""
    scrubbed = ACCOUNT_PATTERN.sub("Account [ACCOUNT_MASKED]", text)
    scrubbed = CARD_PATTERN.sub("[CARD_MASKED]", scrubbed)
    scrubbed = EMAIL_PATTERN.sub("[EMAIL_MASKED]", scrubbed)
    scrubbed = PHONE_PATTERN.sub("[PHONE_MASKED]", scrubbed)
    return scrubbed


def redact_transaction(tx: Dict[str, Any]) -> Dict[str, Any]:
    """Redact sensitive fields from a canonical transaction dictionary."""
    cleaned = dict(tx)
    if "raw_description" in cleaned and cleaned["raw_description"]:
        cleaned["raw_description"] = redact_pii(str(cleaned["raw_description"]))
    if "merchant_name" in cleaned and cleaned["merchant_name"]:
        cleaned["merchant_name"] = redact_pii(str(cleaned["merchant_name"]))
    return cleaned


def redact_transactions(transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Batch redact a list of transaction dictionaries."""
    return [redact_transaction(t) for t in transactions]
