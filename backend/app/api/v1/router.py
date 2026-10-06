"""API v1 Router aggregator."""

from fastapi import APIRouter
from app.api.v1 import (
    analytics,
    auth,
    bank,
    budgets,
    calendar,
    goals,
    statements,
    transactions,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(bank.router, prefix="/bank", tags=["Bank Integration"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["Financial Calendar"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
api_router.include_router(statements.router, prefix="/statements", tags=["Statement Ingestion"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["Budgets & Burn"])
api_router.include_router(goals.router, prefix="/goals", tags=["Financial Goals & FIRE"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["ML & Behavioural Analytics"])
