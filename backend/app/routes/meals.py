from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.crud import create_meal, delete_meal, get_meals_for_day, update_meal
from app.database import get_db
from app.firebase_auth import get_current_user
from app.schemas import AIRecognizedFood, AnalyzeResponse, MealCreate, MealRead, MealUpdate
from app.services.gemini_service import recognizer

router = APIRouter(prefix="/api/meals", tags=["meals"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_and_save_meal(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload a valid image file")

    image_bytes = await file.read()
    detections = recognizer.analyze_food_image(image_bytes)
    if not detections:
        raise HTTPException(status_code=422, detail="No recognizable food found in image")

    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    extension = Path(file.filename or "meal.jpg").suffix or ".jpg"
    filename = f"{uuid4().hex}{extension}"
    output_path = settings.uploads_dir / filename
    output_path.write_bytes(image_bytes)

    # Only save the main dish (highest calories)
    main_detection = max(detections, key=lambda x: x["calories"])

    saved_meals = []
    meal = create_meal(
        db,
        MealCreate(
            name=main_detection["name"],
            calories=main_detection["calories"],
            protein=main_detection["protein"],
            carbs=main_detection["carbs"],
            fats=main_detection["fats"],
            quantity=1.0,
            image_path=str(output_path),
        ),
        user_id=user_id,
    )
    saved_meals.append(meal)

    return AnalyzeResponse(
        meals=saved_meals,
        detections=[AIRecognizedFood(**item) for item in detections],
    )


@router.post("/manual", response_model=MealRead)
def add_manual_meal(
    payload: MealCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return create_meal(db, payload, user_id=user_id)


@router.get("", response_model=list[MealRead])
def list_meals(
    date: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    target = datetime.fromisoformat(date) if date else datetime.utcnow()
    return get_meals_for_day(db, target, user_id=user_id)


@router.put("/{meal_id}", response_model=MealRead)
def edit_meal(
    meal_id: int,
    payload: MealUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    meal = update_meal(db, meal_id, payload, user_id=user_id)
    if meal is None:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@router.delete("/{meal_id}")
def remove_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    success = delete_meal(db, meal_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meal not found")
    return {"success": True}