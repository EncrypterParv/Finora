"""Import all models for metadata aggregation."""

from app.core.database import Base
from app.db.models.user import User
from app.db.models.account import BankAccount
from app.db.models.category import Category, Merchant
from app.db.models.transaction import Transaction
from app.db.models.budget import Budget, BudgetCategory
from app.db.models.goal import FinancialGoal, GoalMilestone
from app.db.models.ml_profile import MLProfile

__all__ = [
    "Base",
    "User",
    "BankAccount",
    "Category",
    "Merchant",
    "Transaction",
    "Budget",
    "BudgetCategory",
    "FinancialGoal",
    "GoalMilestone",
    "MLProfile",
]
