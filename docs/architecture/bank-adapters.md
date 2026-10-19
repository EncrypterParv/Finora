# Bank Adapter Architecture — Finora

## 1. Design Overview

Finora interacts with external banking systems strictly via the **Adapter Pattern**.

### Critical Safety Invariants
- **Zero Real Banking Secrets**: The system will never ask for, transmit, or store real banking passwords, 2FA tokens, or PINs.
- **Simulated Integration Baseline**: All development and demonstrations utilize mock banking adapters (e.g. `HSBCDemoAdapter`, `SBIDemoAdapter`) returning realistic, generated financial streams.
- **Pluggable Architecture**: The domain layer depends exclusively on the `BankAdapter` abstract base class.

---

## 2. Adapter Class Diagram

```mermaid
classDiagram
    class BankAdapter {
        <<interface>>
        +institution_id: str
        +institution_name: str
        +authenticate(credentials: Dict) AuthResult
        +get_accounts(session_token: str) List~RawBankAccount~
        +get_transactions(account_id: str, since: datetime) List~RawBankTransaction~
        +get_balance(account_id: str) BalanceDTO
    }

    class HSBCDemoAdapter {
        +institution_id: "hsbc_demo"
        +institution_name: "HSBC Demo Bank"
        +authenticate(credentials: Dict) AuthResult
        +get_accounts(session_token: str) List~RawBankAccount~
        +get_transactions(account_id: str, since: datetime) List~RawBankTransaction~
        +get_balance(account_id: str) BalanceDTO
        -_generate_demo_stream() List~RawBankTransaction~
    }

    class SBIDemoAdapter {
        +institution_id: "sbi_demo"
        +institution_name: "State Bank of India (Demo)"
        +authenticate(credentials: Dict) AuthResult
        +get_accounts(session_token: str) List~RawBankAccount~
        +get_transactions(account_id: str, since: datetime) List~RawBankTransaction~
        +get_balance(account_id: str) BalanceDTO
    }

    class BankAdapterFactory {
        +get_adapter(institution_id: str) BankAdapter
        +list_supported_institutions() List~InstitutionMetadata~
    }

    BankAdapter <|-- HSBCDemoAdapter
    BankAdapter <|-- SBIDemoAdapter
    BankAdapterFactory ..> BankAdapter : creates
```

---

## 3. HSBC Demo Implementation Mechanics

The `HSBCDemoAdapter` generates deterministic yet rich behavioural patterns:
- **Salaried Income**: Bi-weekly or 1st-of-month salary credits.
- **Recurring Subscriptions**: Netflix, Spotify, AWS, Gym memberships on regular cycles.
- **Impulse Bursts**: Weekend dining out (Swiggy, Zomato) and late-night e-commerce (Amazon, Blinkit).
- **Utility Bills**: Electricity, broadband, mobile recharges mid-month.
- **Realistic Noise**: ATM withdrawals, UPI peer transfers with varying descriptions.
