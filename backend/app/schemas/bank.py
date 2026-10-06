"""Bank adapter schemas and DTOs."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RawBankTransaction(BaseModel):
    raw_id: str
    occurred_at: datetime
    amount: Decimal
    currency: str = "INR"
    is_debit: bool = True
    narration: str
    merchant_raw: str
    balance_after: Optional[Decimal] = None
    reference_number: str
    extra_metadata: Dict[str, Any] = Field(default_factory=dict)


class RawBankAccount(BaseModel):
    account_number_masked: str
    account_type: str
    currency: str = "INR"
    current_balance: Decimal
    institution_id: str


class InstitutionMetadata(BaseModel):
    id: str
    name: str
    logo_url: Optional[str] = None
    is_simulated: bool = True
    supported_features: List[str] = Field(default_factory=lambda: ["ACCOUNTS", "TRANSACTIONS", "BALANCES"])


class BankSyncRequest(BaseModel):
    account_id: str
    institution_id: str = "hsbc_demo"
    simulated_seed: Optional[str] = "demo-profile-1"


class BankSyncResponse(BaseModel):
    account_id: str
    institution_name: str
    synced_at: datetime
    transactions_added: int
    transactions_updated: int
    new_balance: Decimal
    currency: str
