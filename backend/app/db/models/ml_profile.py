"""Machine Learning Behaviour Profile model."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class MLProfile(Base):
    __tablename__ = "ml_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    behavioural_score = Column(Numeric(5, 2), default=75.0, nullable=False)  # 0 to 100
    impulse_spending_index = Column(Numeric(5, 4), default=0.20, nullable=False)  # 0.00 to 1.00
    average_monthly_burn = Column(Numeric(14, 2), default=0.00, nullable=False)
    predicted_savings_rate = Column(Numeric(5, 2), default=20.0, nullable=False)
    
    category_spending_distribution = Column(JSON, default=dict, nullable=False)
    weekend_vs_weekday_ratio = Column(JSON, default=dict, nullable=False)
    feature_weights = Column(JSON, default=dict, nullable=False)
    
    last_computed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="ml_profiles")
