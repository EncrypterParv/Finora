"""Factory registry for instantiating Bank Adapters."""

from typing import Dict, List, Type
from app.domain.bank_adapters.base import BankAdapter
from app.domain.bank_adapters.hsbc_demo import HSBCDemoAdapter
from app.schemas.bank import InstitutionMetadata


class BankAdapterFactory:
    """Registry maintaining bank adapter implementations."""

    _adapters: Dict[str, Type[BankAdapter]] = {
        "hsbc_demo": HSBCDemoAdapter,
    }

    @classmethod
    def register_adapter(cls, institution_id: str, adapter_cls: Type[BankAdapter]) -> None:
        """Register a new bank adapter."""
        cls._adapters[institution_id.lower()] = adapter_cls

    @classmethod
    def get_adapter(cls, institution_id: str) -> BankAdapter:
        """Retrieve instantiated adapter instance."""
        adapter_cls = cls._adapters.get(institution_id.lower())
        if not adapter_cls:
            raise ValueError(f"No adapter registered for institution '{institution_id}'")
        return adapter_cls()

    @classmethod
    def list_supported_institutions(cls) -> List[InstitutionMetadata]:
        """Return list of supported institutions."""
        return [adapter_cls().get_metadata() for adapter_cls in cls._adapters.values()]
