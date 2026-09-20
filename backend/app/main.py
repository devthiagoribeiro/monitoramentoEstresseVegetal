from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app import models  # noqa: F401
from app.config import get_settings
from app.database import Base, engine
from app.dependencies import DbSession
from app.routers import auth, devices
from app.routers.devices import ingestion_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version="2.0.0",
    debug=settings.debug,
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(ingestion_router)


@app.get("/health", tags=["infraestrutura"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["infraestrutura"])
def readiness(db: DbSession) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ready"}
