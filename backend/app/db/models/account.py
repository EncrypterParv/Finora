"""Bank account database model."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_name = Column(String(100), nullable=False)
    account_number_masked = Column(String(50), nullable=False)
    account_type = Column(String(50), default="SAVINGS", nullable=False)  # SAVINGS, CHECKING, CREDIT
    current_balance = Column(Numeric(14, 2), default=0.00, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    adapter_type = Column(String(50), default="HSBC_DEMO", nullable=False)
    
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")
