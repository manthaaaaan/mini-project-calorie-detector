from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.crud import get_daily_goal, get_daily_totals
from app.database import get_db
from app.firebase_auth import get_current_user
from app.schemas import DashboardRead

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/daily", response_model=DashboardRead)
def daily_dashboard(
    date: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    target = datetime.fromisoformat(date) if date else datetime.utcnow()
    totals = get_daily_totals(db, target, user_id=user_id)
    goal = get_daily_goal(db, user_id=user_id)
    progress = min(
        (totals["calories"] / goal.calories_goal) * 100 if goal.calories_goal else 0,
        200,
    )

    return DashboardRead(
        consumed_calories=totals["calories"],
        protein=totals["protein"],
        carbs=totals["carbs"],
        fats=totals["fats"],
        goal_calories=goal.calories_goal,
        progress_percent=progress,
    )