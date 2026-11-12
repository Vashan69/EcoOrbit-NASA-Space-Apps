"""
NapMap API — FastAPI backend.

Serves the live status data that web/js/app.js fetches for the dashboard
(signal strength, active satellite range, orbit count, satellite detail).

Run locally:
    uvicorn api.main:app --reload --port 8000

Then open web/index.html (e.g. via `python -m http.server` from web/, or
any static file server) — app.js will call this API automatically.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.data_acquisition import get_status

app = FastAPI(title="NapMap API", version="1.0.0")

# Allow the static frontend (served from a different port/origin during
# local dev) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/status")
def status():
    """Current dashboard snapshot: signal, active range, orbits, satellite detail."""
    return get_status()


@app.get("/api/health")
def health():
    return {"ok": True}
