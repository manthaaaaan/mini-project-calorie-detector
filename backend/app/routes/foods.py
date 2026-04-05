from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.crud import search_foods
from app.database import get_db
from app.schemas import FoodRead

router = APIRouter(prefix="/api/foods", tags=["foods"])


@router.get("/search", response_model=list[FoodRead])
def search_food_catalog(query: str = Query(min_length=1), db: Session = Depends(get_db)):
    return search_foods(db, query)
