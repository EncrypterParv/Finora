"""Deduplication hash calculation for canonical transactions."""

import hashlib
from datetime import datetime
from decimal import Decimal


def compute_dedup_hash(
    account_id: str,
    occurred_at: datetime,
    amount: Decimal,
    reference_id: str,
) -> str:
    """
    Generate SHA-256 fingerprint for a transaction to guarantee idempotent ingestion.
    Format: SHA256(account_id | iso_timestamp | rounded_amount | reference_id)
    """
    iso_time = occurred_at.strftime("%Y-%m-%dT%H:%M:%S")
    amount_str = f"{amount:.2f}"
    ref_sanitized = reference_id.strip().upper()
    
    payload = f"{account_id}|{iso_time}|{amount_str}|{ref_sanitized}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
