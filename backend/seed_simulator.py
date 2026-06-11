"""
Simulator Management seeder — flush and re-seed simulator vendors,
configurations, and sessions with realistic maritime training data.

Usage: cd backend && python seed_simulator.py
"""
import asyncio
import logging
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import delete, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.integration_log import IntegrationLog
from app.models.simulator_configuration import SimulatorConfiguration
from app.models.simulator_session import SimulatorSession
from app.models.simulator_vendor import SimulatorVendor

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("seed_simulator")

engine = create_async_engine(settings.async_database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


# ── Helpers ────────────────────────────────────────────────────────────────

def uid() -> str:
    return str(uuid.uuid4())


def dt(days_ago: float = 0, hours_ago: float = 0) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)


# ── Flush ──────────────────────────────────────────────────────────────────

async def flush_simulator_data(session: AsyncSession) -> None:
    """Delete all simulator-related records in dependency order."""
    r1 = await session.execute(delete(IntegrationLog))
    r2 = await session.execute(delete(SimulatorSession))
    r3 = await session.execute(delete(SimulatorConfiguration))
    r4 = await session.execute(delete(SimulatorVendor))
    # Reset sequences so IDs restart from 1
    for tbl in ("integration_logs", "simulator_sessions", "simulator_configurations", "simulator_vendors"):
        await session.execute(text(f"ALTER SEQUENCE IF EXISTS {tbl}_id_seq RESTART WITH 1"))
    log.info(
        "Flushed — integration_logs: %d | sessions: %d | configs: %d | vendors: %d",
        r1.rowcount, r2.rowcount, r3.rowcount, r4.rowcount,
    )


# ── Vendors ────────────────────────────────────────────────────────────────

VENDORS = [
    dict(
        uuid=uid(), name="VSTEP Nautis", code="VSTEP",
        vendor_name="VSTEP B.V.", version="Nautis 5.2",
        description="Full-mission bridge, engine room, and offshore simulators from VSTEP. Nautis platform is widely used in maritime academies for STCW-compliant training.",
        base_url="https://api.vstep-nautis.internal/v2",
        integration_type="REST_API", status="active",
    ),
    dict(
        uuid=uid(), name="Kongsberg K-Sim", code="KONGSBERG",
        vendor_name="Kongsberg Digital AS", version="K-Sim Navigation 11",
        description="Kongsberg K-Sim suite covering navigation, engine, cargo, and dynamic positioning. Industry-leading fidelity for advanced officer training.",
        base_url="https://ksim.kongsberg.internal/api",
        integration_type="REST_API", status="active",
    ),
    dict(
        uuid=uid(), name="Wärtsilä NT Pro", code="WARTSILA",
        vendor_name="Wärtsilä Voyage", version="NT Pro 5000 v6.1",
        description="Formerly Transas. NT Pro 5000 bridge simulator used in over 400 training centres worldwide. Supports full COLREGS and ECDIS training.",
        base_url="https://ntpro.wartsila.internal/rest",
        integration_type="REST_API", status="active",
    ),
    dict(
        uuid=uid(), name="FORCE NavSim", code="FORCE",
        vendor_name="FORCE Technology", version="NavSim 7",
        description="Danish full-mission simulator platform from FORCE Technology. Specialises in VTS, tug handling, and harbour manoeuvring training.",
        base_url="https://navsim.force.internal/api/v1",
        integration_type="WEBSOCKET", status="active",
    ),
    dict(
        uuid=uid(), name="Furuno FS-2100", code="FURUNO",
        vendor_name="Furuno Electric Co., Ltd.", version="FS-2100 Rev 3",
        description="Furuno desktop and part-task simulator system for ARPA, ECDIS, and radar operator training. Compact, cost-effective STCW-aligned solution.",
        base_url=None,
        integration_type="FILE_IMPORT", status="active",
    ),
    dict(
        uuid=uid(), name="MarineSoft Simware", code="MARINESOFT",
        vendor_name="MarineSoft Ltd.", version="Simware 4.0",
        description="PC-based part-task simulators for chart work, celestial navigation, and stability calculations. Ideal for cadet programmes.",
        base_url=None,
        integration_type="FILE_IMPORT", status="inactive",
    ),
]


async def seed_vendors(session: AsyncSession) -> dict[str, SimulatorVendor]:
    vendor_map: dict[str, SimulatorVendor] = {}
    for v in VENDORS:
        obj = SimulatorVendor(**v)
        session.add(obj)
        await session.flush()
        vendor_map[v["code"]] = obj
    log.info("Seeded %d simulator vendors", len(vendor_map))
    return vendor_map


# ── Configurations ─────────────────────────────────────────────────────────

async def seed_configurations(
    session: AsyncSession, vendor_map: dict[str, SimulatorVendor]
) -> dict[str, SimulatorConfiguration]:
    configs_data = [
        dict(
            uuid=uid(),
            simulator_vendor_id=vendor_map["VSTEP"].id,
            configuration_name="VSTEP Production — Full Mission Bridge Lab A",
            base_url="https://api.vstep-nautis.internal/v2",
            authentication_type="API_KEY",
            api_key="vstep-prod-fmb-lab-a-key-xxxxxxxx",
            webhook_url="https://naviora.internal/webhooks/vstep",
            connection_timeout=30, status="active",
        ),
        dict(
            uuid=uid(),
            simulator_vendor_id=vendor_map["VSTEP"].id,
            configuration_name="VSTEP Staging — Engine Room Simulator",
            base_url="https://staging.vstep-nautis.internal/v2",
            authentication_type="API_KEY",
            api_key="vstep-stage-ers-key-xxxxxxxx",
            webhook_url=None,
            connection_timeout=30, status="active",
        ),
        dict(
            uuid=uid(),
            simulator_vendor_id=vendor_map["KONGSBERG"].id,
            configuration_name="K-Sim Navigation — Primary Hub",
            base_url="https://ksim.kongsberg.internal/api",
            authentication_type="BEARER",
            api_key=None, client_id="naviora-ksn-client",
            client_secret="ksn-client-secret-xxxxxxxx",
            webhook_url="https://naviora.internal/webhooks/kongsberg",
            connection_timeout=45, status="active",
        ),
        dict(
            uuid=uid(),
            simulator_vendor_id=vendor_map["KONGSBERG"].id,
            configuration_name="K-Sim DP — Dynamic Positioning Lab",
            base_url="https://ksim-dp.kongsberg.internal/api",
            authentication_type="BEARER",
            api_key=None, client_id="naviora-ksdp-client",
            client_secret="ksdp-client-secret-xxxxxxxx",
            webhook_url=None,
            connection_timeout=45, status="inactive",
        ),
        dict(
            uuid=uid(),
            simulator_vendor_id=vendor_map["WARTSILA"].id,
            configuration_name="NT Pro 5000 — Global Training Fleet",
            base_url="https://ntpro.wartsila.internal/rest",
            authentication_type="BASIC",
            api_key=None, client_id="naviora_api",
            client_secret="ntpro-basic-secret-xxxxxxxx",
            webhook_url="https://naviora.internal/webhooks/wartsila",
            connection_timeout=60, status="active",
        ),
        dict(
            uuid=uid(),
            simulator_vendor_id=vendor_map["FORCE"].id,
            configuration_name="NavSim VTS — Vessel Traffic Service Lab",
            base_url="https://navsim.force.internal/api/v1",
            authentication_type="API_KEY",
            api_key="navsim-vts-key-xxxxxxxx",
            webhook_url="wss://navsim.force.internal/ws/events",
            connection_timeout=20, status="active",
        ),
        dict(
            uuid=uid(),
            simulator_vendor_id=vendor_map["FURUNO"].id,
            configuration_name="Furuno FS-2100 — File Import Pipeline",
            base_url=None, authentication_type="NONE",
            api_key=None, client_id=None, client_secret=None,
            webhook_url=None,
            connection_timeout=30, status="active",
        ),
    ]
    config_map: dict[str, SimulatorConfiguration] = {}
    for c in configs_data:
        obj = SimulatorConfiguration(**c)
        session.add(obj)
        await session.flush()
        config_map[c["configuration_name"]] = obj
    log.info("Seeded %d simulator configurations", len(config_map))
    return config_map


# ── Sessions ───────────────────────────────────────────────────────────────

EXERCISE_REFS = [
    ("EX-2026-NAV-001", "Chart Work & Position Fixing"),
    ("EX-2026-NAV-002", "COLREGS — Open Sea Encounter"),
    ("EX-2026-NAV-003", "Coastal Navigation in Restricted Visibility"),
    ("EX-2026-NAV-004", "Night Watch Keeping"),
    ("EX-2026-NAV-005", "Port Entry — Singapore Strait"),
    ("EX-2026-ECDIS-001", "ECDIS Route Planning & Monitoring"),
    ("EX-2026-ECDIS-002", "ECDIS Alarm Management"),
    ("EX-2026-RADAR-001", "Radar Plotting & Target Tracking"),
    ("EX-2026-DP-001", "Dynamic Positioning — Field Arrival"),
    ("EX-2026-ERM-001", "Bridge Resource Management — Emergency"),
    ("EX-2026-MOB-001", "Man Overboard Recovery"),
    ("EX-2026-CARGO-001", "Cargo Loading / Stability Calculation"),
]

CANDIDATE_IDS = [uid() for _ in range(8)]


async def seed_sessions(
    session: AsyncSession, vendor_map: dict[str, SimulatorVendor]
) -> None:
    def sess(
        ref: str, exercise_code: str, vendor_code: str,
        start_offset_days: float, duration_hours: float,
        status: str, remarks: str | None = None,
        candidate_idx: int = 0,
    ) -> SimulatorSession:
        start = dt(days_ago=start_offset_days)
        end = start + timedelta(hours=duration_hours) if status in ("COMPLETED", "FAILED") else None
        dur = int(duration_hours * 3600) if end else None
        return SimulatorSession(
            uuid=uid(),
            session_reference=ref,
            simulator_vendor_id=vendor_map[vendor_code].id,
            candidate_id=CANDIDATE_IDS[candidate_idx % len(CANDIDATE_IDS)],
            organization_id=None,
            assessment_id=uid(),
            exercise_id=exercise_code,
            start_time=start,
            end_time=end,
            duration_seconds=dur,
            status=status,
            remarks=remarks,
            raw_payload={"source": vendor_code, "exercise": exercise_code, "version": "1.0"},
            processed_payload={"score": 78.5, "pass": True} if status == "COMPLETED" else None,
        )

    sessions = [
        # COMPLETED sessions — historical records
        sess("SES-2026-0001", "EX-2026-NAV-001", "VSTEP",     28.0,  4.0, "COMPLETED", candidate_idx=0),
        sess("SES-2026-0002", "EX-2026-NAV-002", "VSTEP",     25.0,  3.5, "COMPLETED", candidate_idx=1),
        sess("SES-2026-0003", "EX-2026-NAV-003", "KONGSBERG", 22.0,  4.5, "COMPLETED", candidate_idx=2),
        sess("SES-2026-0004", "EX-2026-NAV-004", "KONGSBERG", 20.0,  5.0, "COMPLETED", candidate_idx=3),
        sess("SES-2026-0005", "EX-2026-ECDIS-001","WARTSILA", 18.0,  3.0, "COMPLETED", candidate_idx=4),
        sess("SES-2026-0006", "EX-2026-ECDIS-002","WARTSILA", 15.0,  2.5, "COMPLETED", candidate_idx=5),
        sess("SES-2026-0007", "EX-2026-RADAR-001","VSTEP",    13.0,  4.0, "COMPLETED", candidate_idx=6),
        sess("SES-2026-0008", "EX-2026-DP-001",   "KONGSBERG",10.0,  6.0, "COMPLETED", candidate_idx=7),
        sess("SES-2026-0009", "EX-2026-ERM-001",  "KONGSBERG", 8.0,  5.5, "COMPLETED", candidate_idx=0),
        sess("SES-2026-0010", "EX-2026-MOB-001",  "WARTSILA",  6.0,  2.0, "COMPLETED", candidate_idx=1),
        sess("SES-2026-0011", "EX-2026-CARGO-001","FORCE",     5.0,  3.0, "COMPLETED", candidate_idx=2),
        sess("SES-2026-0012", "EX-2026-NAV-005",  "FORCE",     4.5,  4.0, "COMPLETED", candidate_idx=3),
        sess("SES-2026-0013", "EX-2026-NAV-001",  "FURUNO",    4.0,  1.5, "COMPLETED", candidate_idx=4),
        sess("SES-2026-0014", "EX-2026-ECDIS-001","FURUNO",    3.5,  2.0, "COMPLETED", candidate_idx=5),

        # FAILED sessions
        sess("SES-2026-0015", "EX-2026-NAV-003",  "VSTEP",     3.0,  1.2, "FAILED",
             remarks="Simulator hardware fault — bridge screen failure at 72 min. Session voided.", candidate_idx=6),
        sess("SES-2026-0016", "EX-2026-DP-001",   "KONGSBERG", 2.0,  0.5, "FAILED",
             remarks="Network timeout during DP exercise handover. Candidate notified for re-attempt.", candidate_idx=7),

        # CANCELLED sessions
        sess("SES-2026-0017", "EX-2026-ERM-001",  "KONGSBERG", 1.5,  0.0, "CANCELLED",
             remarks="Candidate reported unwell before start. Rescheduled to next cycle.", candidate_idx=0),
        sess("SES-2026-0018", "EX-2026-RADAR-001","WARTSILA",  1.0,  0.0, "CANCELLED",
             remarks="Instructor override — scenario configuration error detected pre-session.", candidate_idx=2),

        # RUNNING sessions — currently active
        sess("SES-2026-0019", "EX-2026-NAV-004",  "VSTEP",     0.0,  0.0, "RUNNING",    candidate_idx=3),
        sess("SES-2026-0020", "EX-2026-ECDIS-002","KONGSBERG", 0.0,  0.0, "RUNNING",    candidate_idx=5),

        # PENDING sessions — scheduled
        sess("SES-2026-0021", "EX-2026-MOB-001",  "WARTSILA",  -0.5, 0.0, "PENDING",    candidate_idx=6),
        sess("SES-2026-0022", "EX-2026-NAV-005",  "KONGSBERG", -1.0, 0.0, "PENDING",    candidate_idx=7),
        sess("SES-2026-0023", "EX-2026-CARGO-001","FORCE",     -1.0, 0.0, "PENDING",    candidate_idx=1),
    ]

    session.add_all(sessions)
    await session.flush()
    log.info("Seeded %d simulator sessions", len(sessions))

    # Summary by status
    from collections import Counter
    counts = Counter(s.status for s in sessions)
    log.info("  Status breakdown: %s", dict(counts))


# ── Main ───────────────────────────────────────────────────────────────────

async def main() -> None:
    log.info("Starting simulator data flush + seed...")
    async with AsyncSessionLocal() as session:
        async with session.begin():
            await flush_simulator_data(session)
            vendor_map = await seed_vendors(session)
            await seed_configurations(session, vendor_map)
            await seed_sessions(session, vendor_map)
    log.info("Simulator seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
