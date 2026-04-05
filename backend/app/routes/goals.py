from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud import get_daily_goal, set_daily_goal
from app.database import get_db
from app.firebase_auth import get_current_user
from app.schemas import DailyGoalRead, DailyGoalUpdate

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.get("/daily", response_model=DailyGoalRead)
def read_goal(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    goal = get_daily_goal(db, user_id=user_id)
    return DailyGoalRead(calories_goal=goal.calories_goal)


@router.put("/daily", response_model=DailyGoalRead)
def update_goal(
    payload: DailyGoalUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    goal = set_daily_goal(db, payload.calories_goal, user_id=user_id)
    return DailyGoalRead(calories_goal=goal.calories_goal)