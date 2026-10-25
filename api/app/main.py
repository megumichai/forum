from fastapi import FastAPI

from .config import settings
from .routers import auth, categories, topics, users

app = FastAPI(title=settings.app_name, version="1.0.0")

app.include_router(auth.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(topics.router, prefix="/api")
app.include_router(users.router, prefix="/api")


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}
