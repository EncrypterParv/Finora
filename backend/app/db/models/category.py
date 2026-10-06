"""Category and Merchant database models."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, index=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    icon = Column(String(50), default="Tag", nullable=False)
    color_hex = Column(String(20), default="#6366F1", nullable=False)
    is_system = Column(Boolean, default=True, nullable=False)
    parent_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    transactions = relationship("Transaction", back_populates="category")
    budget_categories = relationship("BudgetCategory", back_populates="category")


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clean_name = Column(String(150), unique=True, index=True, nullable=False)
    raw_patterns = Column(JSON, default=list, nullable=False)  # List of regex/substrings
    default_category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    logo_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    transactions = relationship("Transaction", back_populates="merchant")
    default_category = relationship("Category")
