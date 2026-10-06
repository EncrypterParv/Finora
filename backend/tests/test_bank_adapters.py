"""Tests for Bank Adapter interface and HSBC Demo Adapter."""

from decimal import Decimal
import pytest
from app.domain.bank_adapters.factory import BankAdapterFactory
from app.domain.bank_adapters.hsbc_demo import HSBCDemoAdapter


@pytest.mark.asyncio
async def test_bank_adapter_factory():
    institutions = BankAdapterFactory.list_supported_institutions()
    assert len(institutions) >= 1
    assert institutions[0].id == "hsbc_demo"
    assert institutions[0].is_simulated is True

    adapter = BankAdapterFactory.get_adapter("hsbc_demo")
    assert isinstance(adapter, HSBCDemoAdapter)
    assert adapter.institution_name == "HSBC Bank (Simulated Demo)"


@pytest.mark.asyncio
async def test_hsbc_demo_adapter_streaming():
    adapter = HSBCDemoAdapter()
    accounts = await adapter.get_accounts()
    assert len(accounts) == 2
    assert accounts[0].account_number_masked == "•••• 4892"

    transactions = await adapter.get_transactions(account_id="test-acc", seed="test-seed")
    assert len(transactions) > 0
    
    # Verify presence of credits (salary) and debits (lifestyle/bills)
    debits = [t for t in transactions if t.is_debit]
    credits = [t for t in transactions if not t.is_debit]

    assert len(debits) > 0
    assert len(credits) > 0
    assert any("SALARY" in c.narration for c in credits)
