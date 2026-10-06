"""Canonical Transaction database model."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(String(36), ForeignKey("bank_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    merchant_id = Column(String(36), ForeignKey("merchants.id", ondelete="SET NULL"), nullable=True, index=True)

    occurred_at = Column(DateTime(timezone=True), nullable=False, index=True)
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    transaction_type = Column(String(20), default="DEBIT", nullable=False)  # DEBIT, CREDIT, TRANSFER
    raw_description = Column(String(500), nullable=False)
    
    balance_before = Column(Numeric(14, 2), nullable=True)
    balance_after = Column(Numeric(14, 2), nullable=True)
    
    reference_id = Column(String(100), nullable=False)
    source = Column(String(50), default="BANK_API", nullable=False)  # BANK_API, CSV, XLSX, PDF, MANUAL
    dedup_hash = Column(String(64), unique=True, index=True, nullable=False)
    
    tax_info = Column(JSON, nullable=True)  # Nullable GST/tax breakdown
    metadata_ = Column("metadata", JSON, default=dict, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Composite index for calendar queries
    __table_args__ = (
        Index("ix_transactions_user_occurred_at", "user_id", "occurred_at"),
    )

    # Relationships
    user = relationship("User", back_populates="transactions")
    account = relationship("BankAccount", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    merchant = relationship("Merchant", back_populates="transactions")
