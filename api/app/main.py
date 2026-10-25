from fastapi import FastAPI

from .config import settings

app = FastAPI(title=settings.app_name, version="1.0.0")


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}
