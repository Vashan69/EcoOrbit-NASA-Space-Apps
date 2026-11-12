"""
Compute and data-acquisition layer for NapMap.

This is where real telemetry would be pulled from (e.g. a satellite
tracking API, ground station feed, or internal database) and turned into
the shape the dashboard expects. For now it returns realistic placeholder
values so the frontend has something to render out of the box.

Swap `get_status()`'s body for a real data source (an HTTP call, a DB
query, a TLE/orbit-propagation computation, etc.) when you're ready.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone


def get_status() -> dict:
    """Return a snapshot of current tracking status for the dashboard."""
    return {
        "signal_strength": _signal_strength(),
        "active_km": "27K",
        "orbits_today": 14,
        "satellite": _satellite_detail(),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def _signal_strength() -> int:
    """Placeholder signal strength, jittered slightly to feel live."""
    return round(80 + random.uniform(-3, 4), 1)


def _satellite_detail() -> dict:
    """Placeholder detail for the tracked satellite card."""
    next_pass = datetime.now(timezone.utc) + timedelta(hours=4, minutes=32)
    return {
        "name": "Vertex 250x",
        "id": "VX-250-A4",
        "altitude_km": 512,
        "velocity_kms": 7.6,
        "next_pass": next_pass.strftime("%H:%M"),
    }
