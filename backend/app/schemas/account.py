"""Bank account request and response schemas."""

from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal, Optional
from pydantic import AfterValidator, BaseModel, ConfigDict, Field

from app.domain.bank_adapters.factory import BankAdapterFactory


# Rejects adapter ids the BankAdapterFactory doesn't know and normalizes them to the stored uppercase form.
def _validate_adapter_type(value: str) -> str:
    """Check the adapter is registered, then return it uppercased (e.g. "HSBC_DEMO")."""
    if not BankAdapterFactory.is_supported(value):
        raise ValueError(f"Unsupported adapter_type '{value}'")
    return value.upper()


# Reusable field types, like shared zod schemas: each carries its own validation wherever it's used.
InstitutionName = Annotated[str, Field(min_length=1, max_length=100)]
Last4 = Annotated[str, Field(pattern=r"^[0-9]{4}$")]
AccountType = Literal["SAVINGS", "CHECKING", "CREDIT"]
Balance = Annotated[Decimal, Field(max_digits=14, decimal_places=2)]
Currency = Annotated[str, Field(pattern=r"^[A-Z]{3}$")]
AdapterType = Annotated[str, AfterValidator(_validate_adapter_type)]


# Builds the stored masked number from the last 4 digits; the full number is never accepted or stored.
def mask_account_number(last4: str) -> str:
    """Return the masked account number stored on the model."""
    return f"XXXX-XXXX-{last4}"


# POST body, like z.object({...}).strict(): unknown keys (user_id, a full account_number) are rejected with 422.
class AccountCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    institution_name: InstitutionName
    account_last4: Last4
    account_type: AccountType
    current_balance: Balance = Decimal("0.00")
    currency: Currency = "INR"
    adapter_type: AdapterType = "HSBC_DEMO"


# PATCH body, like AccountCreate.partial().strict(): every field optional, same validation rules.
class AccountUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    institution_name: Optional[InstitutionName] = None
    account_last4: Optional[Last4] = None
    account_type: Optional[AccountType] = None
    current_balance: Optional[Balance] = None
    currency: Optional[Currency] = None
    adapter_type: Optional[AdapterType] = None


# Response shape, built straight from the ORM row (from_attributes is like serializing a Sequelize instance).
class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    institution_name: str
    account_number_masked: str
    account_type: str
    current_balance: Decimal
    currency: str
    adapter_type: str
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
