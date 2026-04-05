from datetime import datetime

from pydantic import BaseModel, Field


class MealBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    calories: float = Field(ge=0)
    protein: float = Field(ge=0)
    carbs: float = Field(ge=0)
    fats: float = Field(ge=0)
    quantity: float = Field(default=1.0, gt=0)


class MealCreate(MealBase):
    image_path: str | None = None


class MealUpdate(MealBase):
    pass


class MealRead(MealBase):
    id: int
    image_path: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class DailyGoalUpdate(BaseModel):
    calories_goal: int = Field(ge=1, le=10000)


class DailyGoalRead(BaseModel):
    calories_goal: int


class DashboardRead(BaseModel):
    consumed_calories: float
    protein: float
    carbs: float
    fats: float
    goal_calories: int
    progress_percent: float


class FoodRead(BaseModel):
    id: int
    name: str
    calories: float
    protein: float
    carbs: float
    fats: float
    serving: str

    class Config:
        from_attributes = True


class AIRecognizedFood(BaseModel):
    name: str
    calories: float
    protein: float
    carbs: float
    fats: float
    confidence: float


class AnalyzeResponse(BaseModel):
    meals: list[MealRead]
    detections: list[AIRecognizedFood]
