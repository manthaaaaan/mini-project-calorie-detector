from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.crud import ensure_seed_foods
from app.database import Base, SessionLocal, engine
from app.routes.dashboard import router as dashboard_router
from app.routes.foods import router as foods_router
from app.routes.goals import router as goals_router
from app.routes.meals import router as meals_router

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings.uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.uploads_dir), name="uploads")

app.include_router(meals_router)
app.include_router(goals_router)
app.include_router(dashboard_router)
app.include_router(foods_router)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_seed_foods(db)
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {"status": "ok"}
