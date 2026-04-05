from datetime import datetime, time

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.data.foods_seed import SEED_FOODS
from app.models import DailyGoal, Food, Meal
from app.schemas import MealCreate, MealUpdate


def create_meal(db: Session, meal: MealCreate, user_id: str) -> Meal:
    db_meal = Meal(**meal.model_dump(), user_id=user_id)
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)
    return db_meal


def update_meal(db: Session, meal_id: int, meal: MealUpdate, user_id: str) -> Meal | None:
    db_meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == user_id).first()
    if not db_meal:
        return None
    for key, value in meal.model_dump().items():
        setattr(db_meal, key, value)
    db.commit()
    db.refresh(db_meal)
    return db_meal


def delete_meal(db: Session, meal_id: int, user_id: str) -> bool:
    db_meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == user_id).first()
    if not db_meal:
        return False
    db.delete(db_meal)
    db.commit()
    return True


def get_meals_for_day(db: Session, target_date: datetime, user_id: str) -> list[Meal]:
    day_start = datetime.combine(target_date.date(), time.min)
    day_end = datetime.combine(target_date.date(), time.max)
    return (
        db.query(Meal)
        .filter(
            Meal.user_id == user_id,
            Meal.created_at >= day_start,
            Meal.created_at <= day_end,
        )
        .order_by(Meal.created_at.desc())
        .all()
    )


def get_daily_goal(db: Session, user_id: str) -> DailyGoal:
    goal = db.query(DailyGoal).filter(DailyGoal.user_id == user_id).first()
    if goal is None:
        goal = DailyGoal(calories_goal=2000, user_id=user_id)
        db.add(goal)
        db.commit()
        db.refresh(goal)
    return goal


def set_daily_goal(db: Session, calories_goal: int, user_id: str) -> DailyGoal:
    goal = get_daily_goal(db, user_id)
    goal.calories_goal = calories_goal
    db.commit()
    db.refresh(goal)
    return goal


def get_daily_totals(db: Session, target_date: datetime, user_id: str) -> dict[str, float]:
    day_start = datetime.combine(target_date.date(), time.min)
    day_end = datetime.combine(target_date.date(), time.max)
    totals = (
        db.query(
            func.coalesce(func.sum(Meal.calories), 0.0),
            func.coalesce(func.sum(Meal.protein), 0.0),
            func.coalesce(func.sum(Meal.carbs), 0.0),
            func.coalesce(func.sum(Meal.fats), 0.0),
        )
        .filter(
            Meal.user_id == user_id,
            Meal.created_at >= day_start,
            Meal.created_at <= day_end,
        )
        .one()
    )
    return {
        "calories": float(totals[0]),
        "protein": float(totals[1]),
        "carbs": float(totals[2]),
        "fats": float(totals[3]),
    }


def search_foods(db: Session, query: str) -> list[Food]:
    return (
        db.query(Food)
        .filter(Food.name.ilike(f"%{query.strip()}%"))
        .order_by(Food.name.asc())
        .limit(20)
        .all()
    )


def ensure_seed_foods(db: Session) -> None:
    if db.query(Food).count() > 0:
        return
    for food in SEED_FOODS:
        db.add(Food(**food))
    db.commit()