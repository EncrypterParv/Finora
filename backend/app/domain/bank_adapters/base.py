"""Abstract base class for all Bank Adapters."""

from abc import ABC, abstractmethod
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from app.schemas.bank import InstitutionMetadata, RawBankAccount, RawBankTransaction


class BankAdapter(ABC):
    """
    Contract for banking integrations.
    All interactions with external/mock banking endpoints must implement this interface.
    """

    @property
    @abstractmethod
    def institution_id(self) -> str:
        """Unique identifier of the banking institution."""
        pass

    @property
    @abstractmethod
    def institution_name(self) -> str:
        """Human-readable name of the institution."""
        pass

    @abstractmethod
    def get_metadata(self) -> InstitutionMetadata:
        """Retrieve institution capabilities and visual assets."""
        pass

    @abstractmethod
    async def authenticate(self, session_payload: Dict[str, Any]) -> bool:
        """
        Validate mock authentication session.
        NOTE: Real banking passwords must NEVER be accepted or stored.
        """
        pass

    @abstractmethod
    async def get_accounts(self, session_token: Optional[str] = None) -> List[RawBankAccount]:
        """Fetch all accounts associated with the session."""
        pass

    @abstractmethod
    async def get_transactions(
        self,
        account_id: str,
        since: Optional[datetime] = None,
        seed: Optional[str] = None,
    ) -> List[RawBankTransaction]:
        """Fetch raw transaction list since a given timestamp."""
        pass

    @abstractmethod
    async def get_balance(self, account_id: str) -> Decimal:
        """Retrieve latest settled balance for an account."""
        pass
