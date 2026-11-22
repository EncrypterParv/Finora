"""Canonical Transaction schemas and Enums."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class TransactionType(str, Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"
    TRANSFER = "TRANSFER"


class TransactionSource(str, Enum):
    BANK_API = "BANK_API"
    CSV = "CSV"
    XLSX = "XLSX"
    PDF = "PDF"
    IMAGE = "IMAGE"
    MANUAL = "MANUAL"


class TaxMetadata(BaseModel):
    gst_rate_pct: Optional[Decimal] = None
    cgst_amount: Optional[Decimal] = None
    sgst_amount: Optional[Decimal] = None
    igst_amount: Optional[Decimal] = None
    hsn_sac_code: Optional[str] = None
    tax_invoice_number: Optional[str] = None


class CanonicalTransactionBase(BaseModel):
    account_id: str
    occurred_at: datetime
    amount: Decimal = Field(..., gt=0, description="Absolute transaction value")
    currency: str = "INR"
    transaction_type: TransactionType = TransactionType.DEBIT
    raw_description: str = Field(..., min_length=1, max_length=500)
    merchant_name: str = Field(..., min_length=1, max_length=255)
    category_name: str = Field(default="General", min_length=1, max_length=100)
    balance_before: Optional[Decimal] = None
    balance_after: Optional[Decimal] = None
    reference_id: str = Field(..., min_length=1, max_length=100)
    source: TransactionSource = TransactionSource.BANK_API
    tax_info: Optional[TaxMetadata] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CanonicalTransactionCreate(CanonicalTransactionBase):
    pass


# POST /transactions body for manual entry (e.g. cash), like a strict zod schema: unknown keys such as user_id -> 422.
class ManualTransactionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    account_id: str
    occurred_at: datetime
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    transaction_type: Literal["DEBIT", "CREDIT"]
    description: str = Field(min_length=1, max_length=500)
    currency: Optional[str] = Field(default=None, pattern=r"^[A-Z]{3}$")

    # Treats a timestamp without a timezone as UTC, stores it in UTC, and rejects anything over a day ahead.
    @field_validator("occurred_at")
    @classmethod
    def _normalize_occurred_at(cls, value: datetime) -> datetime:
        """Return occurred_at in UTC, or raise if it is more than 1 day in the future."""
        value = value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
        if value > datetime.now(timezone.utc) + timedelta(days=1):
            raise ValueError("occurred_at cannot be more than 1 day in the future")
        return value


class CanonicalTransactionResponse(CanonicalTransactionBase):
    id: str
    user_id: str
    category_id: Optional[str] = None
    merchant_id: Optional[str] = None
    dedup_hash: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionDetailResponse(CanonicalTransactionResponse):
    """Rich detail view with predictive and behavioural context."""
    monthly_budget_allocated: Optional[Decimal] = None
    monthly_budget_spent: Optional[Decimal] = None
    monthly_budget_utilization_pct: Optional[Decimal] = None
    projected_monthly_spend: Optional[Decimal] = None
    projected_budget_exhaustion_date: Optional[str] = None
    recommended_daily_spend: Optional[Decimal] = None
    is_anomaly: bool = False
    anomaly_reason: Optional[str] = None


class StatementPreviewResponse(BaseModel):
    format: str
    needs_review: bool
    warnings: list[str] = Field(default_factory=list)
    transactions: list[CanonicalTransactionCreate] = Field(max_length=500)


class StatementImportRequest(BaseModel):
    account_id: str = Field(min_length=1, max_length=36)
    source_format: str = Field(pattern="^(csv|pdf|image)$")
    transactions: list[CanonicalTransactionCreate] = Field(min_length=1, max_length=500)


class StatementImportResponse(BaseModel):
    account_id: str
    transactions_confirmed: int
    transactions_added: int
    duplicates_skipped: int
