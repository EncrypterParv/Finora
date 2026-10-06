"""Canonical Transaction schemas and Enums."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class TransactionType(str, Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"
    TRANSFER = "TRANSFER"


class TransactionSource(str, Enum):
    BANK_API = "BANK_API"
    CSV = "CSV"
    XLSX = "XLSX"
    PDF = "PDF"
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
    raw_description: str
    merchant_name: str
    category_name: str = "General"
    balance_before: Optional[Decimal] = None
    balance_after: Optional[Decimal] = None
    reference_id: str
    source: TransactionSource = TransactionSource.BANK_API
    tax_info: Optional[TaxMetadata] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CanonicalTransactionCreate(CanonicalTransactionBase):
    pass


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
