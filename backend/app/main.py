"""
RailSync AI — FastAPI Main Application Entrypoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.database import init_db, SessionLocal
from backend.app.pipeline.ingestion import ingest_all_data
from dataset_generation.config import DEFAULT_OUTPUT_DIR

from backend.app.routers.ingestion_router import router as ingestion_router
from backend.app.routers.tasks_router import router as tasks_router
from backend.app.routers.trains_router import router as trains_router
from backend.app.routers.candidate_windows_router import router as windows_router
from backend.app.routers.optimization_router import router as opt_router
from backend.app.routers.schedules_router import router as schedules_router
from backend.app.routers.reoptimization_router import router as reopt_router
from backend.app.routers.metrics_router import router as metrics_router
from backend.app.routers.audit_router import router as audit_router
from backend.app.routers.opportunity_router import router as opportunity_router
from backend.app.routers.demo_router import router as demo_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    init_db()
    # Auto-seed if empty
    db = SessionLocal()
    try:
        from backend.app.models.db_models import Station
        if db.query(Station).count() == 0 and DEFAULT_OUTPUT_DIR.exists():
            print("[*] Empty database detected. Auto-ingesting synthetic baseline data...")
            ingest_all_data(DEFAULT_OUTPUT_DIR, db=db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="RailSync AI — Automated Block Planning API",
    description="Intelligent Master Scheduling & Decision Support System for Indian Railways (SIH26027)",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local React/Vite development and deployed production frontend
import os
cors_origins_raw = os.getenv("ALLOWED_ORIGINS", os.getenv("CORS_ORIGINS", "*"))
allowed_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()] if cors_origins_raw != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True if cors_origins_raw != "*" else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Routers
app.include_router(ingestion_router)
app.include_router(tasks_router)
app.include_router(trains_router)
app.include_router(windows_router)
app.include_router(opt_router)
app.include_router(schedules_router)
app.include_router(reopt_router)
app.include_router(metrics_router)
app.include_router(audit_router)
app.include_router(opportunity_router)
app.include_router(demo_router)


@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "RailSync AI Prototype Backend",
        "version": "1.0.0",
        "solver": "Google OR-Tools CP-SAT",
        "validator": "Independent Sentinel Validator"
    }
