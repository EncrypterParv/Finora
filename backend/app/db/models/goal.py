"""Financial Goal and Milestone database models."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Numeric, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class FinancialGoal(Base):
    __tablename__ = "financial_goals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    goal_type = Column(String(50), default="EMERGENCY_FUND", nullable=False)  # EMERGENCY_FUND, EDUCATION, CAR, HOUSE, TRAVEL, RETIREMENT, FIRE, CUSTOM
    target_amount = Column(Numeric(14, 2), nullable=False)
    current_saved = Column(Numeric(14, 2), default=0.00, nullable=False)
    monthly_contribution = Column(Numeric(14, 2), default=0.00, nullable=False)
    target_date = Column(Date, nullable=False)
    expected_annual_return_pct = Column(Numeric(5, 2), default=8.00, nullable=False)
    status = Column(String(20), default="IN_PROGRESS", nullable=False)  # IN_PROGRESS, COMPLETED, PAUSED
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="goals")
    milestones = relationship("GoalMilestone", back_populates="goal", cascade="all, delete-orphan")


class GoalMilestone(Base):
    __tablename__ = "goal_milestones"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    goal_id = Column(String(36), ForeignKey("financial_goals.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    target_amount = Column(Numeric(14, 2), nullable=False)
    target_date = Column(Date, nullable=False)
    is_achieved = Column(Boolean, default=False, nullable=False)
    achieved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    goal = relationship("FinancialGoal", back_populates="milestones")
