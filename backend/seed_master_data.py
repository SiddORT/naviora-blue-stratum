"""Seed script — Maritime Master Data (Sprint 2.2).

Run: cd backend && python seed_master_data.py
Idempotent — skips records that already exist.
"""
import asyncio
import sys

sys.path.insert(0, ".")

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_async_engine(settings.async_database_url, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def upsert(session: AsyncSession, table: str, unique_col: str, rows: list[dict]) -> int:
    created = 0
    for row in rows:
        exists = (await session.execute(
            text(f"SELECT 1 FROM {table} WHERE {unique_col} = :{unique_col} AND deleted_at IS NULL LIMIT 1"),
            {unique_col: row[unique_col]},
        )).scalar()
        if not exists:
            cols = ", ".join(row.keys())
            vals = ", ".join(f":{k}" for k in row.keys())
            await session.execute(text(f"INSERT INTO {table} ({cols}) VALUES ({vals})"), row)
            created += 1
    return created


async def seed():
    import uuid as _uuid

    async with AsyncSessionLocal() as session:
        async with session.begin():

            # ── Weather Conditions ──────────────────────────────────────
            weather = [
                {"name": "Clear",       "wind_speed": 5.0,  "precipitation_level": "None",     "visibility_range": 10.0, "status": "active"},
                {"name": "Cloudy",      "wind_speed": 10.0, "precipitation_level": "None",     "visibility_range": 8.0,  "status": "active"},
                {"name": "Rain",        "wind_speed": 15.0, "precipitation_level": "Light",    "visibility_range": 5.0,  "status": "active"},
                {"name": "Heavy Rain",  "wind_speed": 25.0, "precipitation_level": "Heavy",    "visibility_range": 2.0,  "status": "active"},
                {"name": "Fog",         "wind_speed": 3.0,  "precipitation_level": "None",     "visibility_range": 0.5,  "status": "active"},
                {"name": "Storm",       "wind_speed": 50.0, "precipitation_level": "Heavy",    "visibility_range": 1.0,  "status": "active"},
                {"name": "Cyclone",     "wind_speed": 90.0, "precipitation_level": "Extreme",  "visibility_range": 0.2,  "status": "active"},
                {"name": "Snow",        "wind_speed": 20.0, "precipitation_level": "Moderate", "visibility_range": 1.5,  "status": "active"},
            ]
            for row in weather:
                row["uuid"] = str(_uuid.uuid4())
            wc = await upsert(session, "weather_conditions", "name", weather)
            print(f"  Weather conditions: {wc} created")

            # ── Sea States ──────────────────────────────────────────────
            sea_states = [
                {"name": "Calm",        "wave_height_min": 0.0, "wave_height_max": 0.1,  "description": "Glassy sea, no waves", "status": "active"},
                {"name": "Slight",      "wave_height_min": 0.1, "wave_height_max": 0.5,  "description": "Small wavelets",       "status": "active"},
                {"name": "Moderate",    "wave_height_min": 0.5, "wave_height_max": 1.25, "description": "Large wavelets",       "status": "active"},
                {"name": "Rough",       "wave_height_min": 1.25,"wave_height_max": 2.5,  "description": "Moderate waves",       "status": "active"},
                {"name": "Very Rough",  "wave_height_min": 2.5, "wave_height_max": 4.0,  "description": "Large waves",          "status": "active"},
                {"name": "High",        "wave_height_min": 4.0, "wave_height_max": 6.0,  "description": "Very large waves",     "status": "active"},
                {"name": "Very High",   "wave_height_min": 6.0, "wave_height_max": 9.0,  "description": "Extremely large waves","status": "active"},
                {"name": "Phenomenal",  "wave_height_min": 9.0, "wave_height_max": 14.0, "description": "Phenomenal waves",     "status": "active"},
            ]
            for row in sea_states:
                row["uuid"] = str(_uuid.uuid4())
            ss = await upsert(session, "sea_states", "name", sea_states)
            print(f"  Sea states: {ss} created")

            # ── Visibility Conditions ───────────────────────────────────
            visibility = [
                {"name": "Excellent",        "visibility_distance": 10.0, "description": "Visibility >10 NM",    "status": "active"},
                {"name": "Good",             "visibility_distance": 5.0,  "description": "Visibility 5–10 NM",   "status": "active"},
                {"name": "Moderate",         "visibility_distance": 2.0,  "description": "Visibility 2–5 NM",    "status": "active"},
                {"name": "Poor",             "visibility_distance": 1.0,  "description": "Visibility 1–2 NM",    "status": "active"},
                {"name": "Restricted",       "visibility_distance": 0.5,  "description": "Visibility 0.5–1 NM",  "status": "active"},
                {"name": "Very Restricted",  "visibility_distance": 0.1,  "description": "Visibility <0.5 NM",   "status": "active"},
            ]
            for row in visibility:
                row["uuid"] = str(_uuid.uuid4())
            vc = await upsert(session, "visibility_conditions", "name", visibility)
            print(f"  Visibility conditions: {vc} created")

            # ── Time of Day ─────────────────────────────────────────────
            time_of_day = [
                {"name": "Day",   "description": "Full daylight, good solar illumination",       "status": "active"},
                {"name": "Night", "description": "No solar illumination, relying on artificial light","status": "active"},
                {"name": "Dawn",  "description": "Twilight period after sunrise",                 "status": "active"},
                {"name": "Dusk",  "description": "Twilight period before sunset",                 "status": "active"},
            ]
            for row in time_of_day:
                row["uuid"] = str(_uuid.uuid4())
            tod = await upsert(session, "time_of_day", "name", time_of_day)
            print(f"  Time of day: {tod} created")

        # Build environment profiles using seeded IDs (separate transaction)
        async with session.begin():
            def _id(table, name_col, name):
                return text(f"SELECT id FROM {table} WHERE {name_col} = :n AND deleted_at IS NULL LIMIT 1")

            async def _fetch_id(table, col, val):
                row = (await session.execute(text(f"SELECT id FROM {table} WHERE {col}=:v AND deleted_at IS NULL LIMIT 1"), {"v": val})).scalar()
                return row

            profiles = [
                {
                    "profile_name":            "Clear Day Navigation",
                    "weather_condition_name":  "Clear",
                    "sea_state_name":          "Slight",
                    "visibility_condition_name":"Excellent",
                    "time_of_day_name":        "Day",
                    "description":             "Ideal navigation conditions",
                },
                {
                    "profile_name":            "Restricted Visibility Crossing",
                    "weather_condition_name":  "Fog",
                    "sea_state_name":          "Calm",
                    "visibility_condition_name":"Very Restricted",
                    "time_of_day_name":        "Day",
                    "description":             "Dense fog, very low visibility",
                },
                {
                    "profile_name":            "Heavy Weather Transit",
                    "weather_condition_name":  "Storm",
                    "sea_state_name":          "High",
                    "visibility_condition_name":"Poor",
                    "time_of_day_name":        "Day",
                    "description":             "Storm conditions, significant wave height",
                },
                {
                    "profile_name":            "Night Port Entry",
                    "weather_condition_name":  "Clear",
                    "sea_state_name":          "Slight",
                    "visibility_condition_name":"Good",
                    "time_of_day_name":        "Night",
                    "description":             "Night-time port approach and entry",
                },
                {
                    "profile_name":            "Foggy Coastal Navigation",
                    "weather_condition_name":  "Fog",
                    "sea_state_name":          "Moderate",
                    "visibility_condition_name":"Restricted",
                    "time_of_day_name":        "Dawn",
                    "description":             "Coastal passage in foggy conditions",
                },
            ]

            ep_created = 0
            for p in profiles:
                exists = (await session.execute(
                    text("SELECT 1 FROM environment_profiles WHERE profile_name=:n AND deleted_at IS NULL LIMIT 1"),
                    {"n": p["profile_name"]},
                )).scalar()
                if not exists:
                    wc_id = await _fetch_id("weather_conditions", "name", p["weather_condition_name"])
                    ss_id = await _fetch_id("sea_states", "name", p["sea_state_name"])
                    vc_id = await _fetch_id("visibility_conditions", "name", p["visibility_condition_name"])
                    tod_id = await _fetch_id("time_of_day", "name", p["time_of_day_name"])
                    await session.execute(text("""
                        INSERT INTO environment_profiles
                            (uuid, profile_name, weather_condition_id, sea_state_id,
                             visibility_condition_id, time_of_day_id, description, status)
                        VALUES
                            (:uuid, :profile_name, :wc_id, :ss_id, :vc_id, :tod_id, :description, 'active')
                    """), {
                        "uuid": str(_uuid.uuid4()),
                        "profile_name": p["profile_name"],
                        "wc_id": wc_id, "ss_id": ss_id, "vc_id": vc_id, "tod_id": tod_id,
                        "description": p["description"],
                    })
                    ep_created += 1

            print(f"  Environment profiles: {ep_created} created")

    print("Master data seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
