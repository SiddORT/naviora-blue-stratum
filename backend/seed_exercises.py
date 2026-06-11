"""
Exercise Builder seeder — seeds all 5 exercise module tables with
comprehensive maritime training data.

Usage: cd backend && python seed_exercises.py
"""
import asyncio
import logging
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.exercise import Exercise
from app.models.exercise_category import ExerciseCategory
from app.models.exercise_objective import ExerciseObjective
from app.models.exercise_variant import ExerciseVariant
from app.models.exercise_version import ExerciseVersion
from app.models.objective import Objective
from app.models.scenario import Scenario
from app.models.port import Port
from app.models.environment_profile import EnvironmentProfile
from app.models.vessel import Vessel

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("seed_exercises")

engine = create_async_engine(settings.async_database_url, echo=False)
DB = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


def uid() -> str:
    return str(uuid.uuid4())


async def flush_all(session: AsyncSession) -> None:
    counts = {}
    for Model, tbl in [
        (ExerciseObjective, "exercise_objectives"),
        (ExerciseVariant,   "exercise_variants"),
        (ExerciseVersion,   "exercise_versions"),
        (Exercise,          "exercises"),
        (Scenario,          "scenarios"),
        (Objective,         "objectives"),
        (ExerciseCategory,  "exercise_categories"),
    ]:
        r = await session.execute(delete(Model))
        counts[tbl] = r.rowcount
        await session.execute(text(f"ALTER SEQUENCE IF EXISTS {tbl}_id_seq RESTART WITH 1"))
    log.info("Flushed: %s", counts)


# ── Exercise Categories ──────────────────────────────────────────────────────

CATEGORIES = [
    ("COLREG",                     "COLREG",   "International Regulations for Preventing Collisions at Sea — rules application and compliance."),
    ("Navigation",                 "NAV",      "Nautical navigation principles: passage planning, chartwork, position fixing, and ECDIS."),
    ("Emergency Response",         "EMERG",    "Emergency procedures covering MOB, abandon ship, fire, flooding, and medical emergencies."),
    ("Port Operations",            "PORT_OPS", "Harbour manoeuvring, berthing, unberthing, anchor work, and port communication."),
    ("Restricted Visibility",      "RESTR_VIS","Navigation and collision avoidance in fog, mist, and poor visibility conditions."),
    ("Bridge Resource Management", "BRM",      "Teamwork, communication, situation awareness, and leadership on the bridge."),
    ("Vessel Handling",            "VH",       "Ship manoeuvring including turning, stopping, interaction effects, and wind/current compensation."),
]

async def seed_categories(session: AsyncSession) -> dict[str, ExerciseCategory]:
    objs: dict[str, ExerciseCategory] = {}
    for name, code, desc in CATEGORIES:
        o = ExerciseCategory(uuid=uid(), category_name=name, category_code=code, description=desc, status="active")
        session.add(o)
        await session.flush()
        objs[name] = o
    log.info("Seeded %d categories", len(objs))
    return objs


# ── Objectives ────────────────────────────────────────────────────────────────

OBJECTIVES = [
    ("Collision Avoidance",    "COL_AVOID",   "Collision Avoidance",  "Apply COLREG rules to avoid collision with other vessels in all conditions."),
    ("Rule Compliance",        "RULE_COMP",   "Rule Compliance",      "Demonstrate correct application of COLREG Parts B and C in encounter scenarios."),
    ("Situational Awareness",  "SIT_AWARE",   "Situational Awareness","Maintain full awareness of vessel position, traffic, weather, and hazards."),
    ("Risk Assessment",        "RISK_ASSESS", "Risk Assessment",      "Identify, evaluate, and mitigate navigational and operational risks."),
    ("Decision Making",        "DECISION",    "Decision Making",      "Make timely and correct decisions under pressure and with incomplete information."),
    ("Communication",          "COMMS",       "Communication",        "Conduct effective VHF, internal, and bridge-to-bridge communications per ITU standards."),
    ("Traffic Management",     "TRAF_MGMT",   "Traffic Management",   "Manage vessel movements in busy traffic lanes, TSS, and port approaches."),
    ("Passage Planning",       "PASS_PLAN",   "Navigation",           "Prepare and execute a complete passage plan from berth to berth."),
    ("Position Fixing",        "POS_FIX",     "Navigation",           "Determine vessel position using visual, radar, GNSS, and ECDIS methods."),
    ("Anchor Work",            "ANCHOR",      "Port Operations",      "Execute safe anchoring, anchor watch, and emergency anchor deployment."),
    ("Berthing Operations",    "BERTHING",    "Port Operations",      "Manoeuvre vessel safely alongside in varied wind and current conditions."),
    ("Fog Navigation",         "FOG_NAV",     "Restricted Visibility","Navigate safely in restricted visibility using radar, AIS, and sound signals."),
    ("BRM Teamwork",           "BRM_TEAM",    "Bridge Resource Management","Apply BRM principles to coordinate bridge team during complex manoeuvres."),
    ("Emergency MOB",          "MOB",         "Emergency Response",   "Execute man overboard procedure including Williamson Turn and search pattern."),
    ("Heavy Weather Routing",  "HWY_ROUTE",   "Navigation",           "Select and execute a safe route avoiding heavy weather and restricted areas."),
]

async def seed_objectives(session: AsyncSession) -> dict[str, Objective]:
    objs: dict[str, Objective] = {}
    for name, code, area, desc in OBJECTIVES:
        o = Objective(uuid=uid(), objective_name=name, objective_code=code, competency_area=area, description=desc, status="active")
        session.add(o)
        await session.flush()
        objs[name] = o
    log.info("Seeded %d objectives", len(objs))
    return objs


# ── Scenarios ────────────────────────────────────────────────────────────────

SCENARIOS = [
    ("Crossing Situation — Open Ocean",       "CROSS_OCEAN",   "Crossing",                    "Intermediate", "Two vessels on crossing courses in open ocean. Stand-on and give-way vessel roles."),
    ("Crossing Situation — Restricted Water", "CROSS_RESTR",   "Crossing",                    "Advanced",     "Crossing in confined waters near traffic lane with depth restrictions."),
    ("Head-On Encounter",                     "HEAD_ON",       "Head-On",                     "Beginner",     "Two vessels approaching head-on in a narrow channel. Rule 14 application."),
    ("Overtaking — Open Sea",                 "OVT_OPEN",      "Overtaking",                  "Beginner",     "Overtaking a slower vessel in open water. Rule 13 application."),
    ("Overtaking — Narrow Channel",           "OVT_NARROW",    "Overtaking",                  "Intermediate", "Overtaking in a narrow channel. Sound signals, whistle and reply required."),
    ("Fog Crossing — TSS",                    "FOG_TSS",       "Restricted Visibility",        "Advanced",     "Crossing a traffic separation scheme in thick fog. Radar and AIS required."),
    ("Dense Fog — Port Approach",             "FOG_PORT",      "Restricted Visibility",        "Expert",       "Inbound port approach in dense fog. Speed reduction, sound signals, pilotage."),
    ("Port Entry — Day",                      "PORT_ENTRY_DAY","Port Entry",                   "Beginner",     "Standard port entry in clear weather with pilot. VTS communication."),
    ("Port Entry — Night",                    "PORT_ENTRY_NGT","Port Entry",                   "Intermediate", "Night inbound port approach. Navigation lights and radar primary references."),
    ("Port Exit — Loaded Tanker",             "PORT_EXIT_TK",  "Port Exit",                   "Advanced",     "Deep draft tanker departing port with strong cross current and wind."),
    ("Pilotage — Confined Waters",            "PILOT_CONF",    "Pilotage",                    "Advanced",     "Piloted transit through confined waters with tight turns and bridges."),
    ("Multi Vessel Encounter",                "MULTI_VES",     "Multi Vessel Encounter",       "Expert",       "Three or more vessels converging. Priority, give-way, and stand-on decisions."),
    ("Man Overboard — Day",                   "MOB_DAY",       "Man Overboard",               "Intermediate", "MOB in daylight in moderate sea state. Williamson Turn and search."),
    ("Man Overboard — Night",                 "MOB_NGT",       "Man Overboard",               "Advanced",     "Night MOB in poor visibility. SART, searchlight, and lifeboat deployment."),
    ("Engine Failure — Approach",             "ENG_FAIL",      "Engine Failure",              "Expert",       "Engine failure on final approach to port. Emergency anchor and VHF distress."),
    ("Steering Failure — Open Ocean",         "STEER_FAIL",    "Steering Failure",            "Advanced",     "Main steering failure in open ocean. Emergency steering, NUC lights."),
    ("Heavy Weather Passage",                 "HWY_PASS",      "Emergency Response",          "Advanced",     "Passage planning and execution through Force 8 conditions."),
    ("TSS Crossing — Busy Lane",              "TSS_BUSY",      "Traffic Separation Scheme",    "Intermediate", "Crossing a busy TSS at right angles with correct light and sound signals."),
    ("Anchor Watch — Dragging",               "ANCHOR_DRAG",   "Emergency Response",          "Intermediate", "Vessel at anchor begins dragging in deteriorating weather. Emergency procedures."),
    ("BRM — Watch Handover",                  "BRM_HANDOVER",  "Multi Vessel Encounter",       "Beginner",     "Watch handover at dawn with several vessels in vicinity. Situational briefing."),
]

async def seed_scenarios(session: AsyncSession) -> dict[str, Scenario]:
    objs: dict[str, Scenario] = {}
    for name, code, stype, diff, desc in SCENARIOS:
        o = Scenario(uuid=uid(), scenario_name=name, scenario_code=code, scenario_type=stype, difficulty=diff, description=desc, status="active")
        session.add(o)
        await session.flush()
        objs[name] = o
    log.info("Seeded %d scenarios", len(objs))
    return objs


# ── Exercises + Variants ──────────────────────────────────────────────────────

async def seed_exercises_and_variants(
    session: AsyncSession,
    cats: dict[str, ExerciseCategory],
    objs: dict[str, Objective],
    scens: dict[str, Scenario],
) -> None:
    # look up master-data PKs
    ports_q = await session.execute(select(Port).where(Port.deleted_at.is_(None)).limit(5))
    port_list = list(ports_q.scalars().all())

    ep_q = await session.execute(select(EnvironmentProfile).where(EnvironmentProfile.deleted_at.is_(None)).limit(10))
    ep_list = list(ep_q.scalars().all())

    v_q = await session.execute(select(Vessel).where(Vessel.deleted_at.is_(None)).limit(10))
    vessel_list = list(v_q.scalars().all())

    def port(i=0): return port_list[i].id if len(port_list) > i else None
    def ep(i=0): return ep_list[i].id if len(ep_list) > i else None
    def vessel(i=0): return vessel_list[i].id if len(vessel_list) > i else None

    exercises_data = [
        # (name, code, cat_key, scen_key, diff, passing, duration, obj_keys, variants)
        (
            "Crossing Situation Assessment", "CSA-001",
            "COLREG", "Crossing Situation — Open Ocean", "Intermediate", 70, 45,
            ["Collision Avoidance", "Rule Compliance", "Situational Awareness"],
            [
                ("Day Crossing — Clear",    "CSA-001-V1", ep(0), port(0), vessel(0), vessel(1), None, 45),
                ("Night Crossing — Clear",  "CSA-001-V2", ep(2), port(0), vessel(0), vessel(1), None, 45),
                ("Fog Crossing",            "CSA-001-V3", ep(5), port(0), vessel(0), vessel(1), None, 60),
                ("Storm Crossing",          "CSA-001-V4", ep(9), port(0), vessel(0), vessel(2), None, 60),
                ("Tanker Crossing — Day",   "CSA-001-V5", ep(0), port(0), vessel(3), vessel(4), None, 45),
            ],
        ),
        (
            "Head-On Encounter Procedure", "HOE-001",
            "COLREG", "Head-On Encounter", "Beginner", 75, 30,
            ["Rule Compliance", "Collision Avoidance", "Communication"],
            [
                ("Day Head-On — Open Ocean",  "HOE-001-V1", ep(0), port(0), vessel(0), vessel(2), None, 30),
                ("Night Head-On — Open Ocean","HOE-001-V2", ep(2), port(0), vessel(0), vessel(2), None, 30),
                ("Head-On — Narrow Channel",  "HOE-001-V3", ep(1), port(1), vessel(5), vessel(6), None, 40),
            ],
        ),
        (
            "Port Entry Procedure", "PEP-001",
            "Port Operations", "Port Entry — Day", "Beginner", 70, 60,
            ["Berthing Operations", "Communication", "Traffic Management"],
            [
                ("Day Port Entry — Clear",   "PEP-001-V1", ep(0), port(0), vessel(0), None, None, 60),
                ("Night Port Entry — Clear", "PEP-001-V2", ep(4), port(0), vessel(0), None, None, 60),
                ("Port Entry — Loaded Tanker","PEP-001-V3",ep(0), port(2), vessel(4), None, None, 75),
            ],
        ),
        (
            "Man Overboard Response", "MOB-001",
            "Emergency Response", "Man Overboard — Day", "Intermediate", 80, 45,
            ["Emergency MOB", "Decision Making", "BRM Teamwork"],
            [
                ("MOB — Day, Slight Sea",    "MOB-001-V1", ep(0), None, vessel(0), None, None, 45),
                ("MOB — Night, Moderate Sea","MOB-001-V2", ep(2), None, vessel(0), None, None, 50),
                ("MOB — Fog",               "MOB-001-V3", ep(5), None, vessel(0), None, None, 55),
                ("MOB — Heavy Weather",     "MOB-001-V4", ep(9), None, vessel(0), None, None, 60),
            ],
        ),
        (
            "Fog Navigation in TSS", "FNT-001",
            "Restricted Visibility", "Fog Crossing — TSS", "Advanced", 75, 60,
            ["Fog Navigation", "Rule Compliance", "Situational Awareness", "Traffic Management"],
            [
                ("TSS Fog Crossing — Merchant","FNT-001-V1", ep(5), port(0), vessel(0), vessel(1), None, 60),
                ("TSS Dense Fog — Tanker",    "FNT-001-V2", ep(6), port(0), vessel(4), vessel(2), None, 75),
            ],
        ),
        (
            "Bridge Resource Management — Watch", "BRM-001",
            "Bridge Resource Management", "BRM — Watch Handover", "Beginner", 70, 30,
            ["BRM Teamwork", "Situational Awareness", "Communication"],
            [
                ("Dawn Watch Handover", "BRM-001-V1", ep(3), port(0), vessel(0), None, None, 30),
            ],
        ),
        (
            "Heavy Weather Passage Planning", "HWP-001",
            "Navigation", "Heavy Weather Passage", "Advanced", 75, 90,
            ["Heavy Weather Routing", "Decision Making", "Passage Planning"],
            [
                ("North Atlantic Gale — Container",  "HWP-001-V1", ep(10), port(1), vessel(0), None, None, 90),
                ("Tropical Cyclone Avoidance",       "HWP-001-V2", ep(11), port(3), vessel(4), None, None, 90),
            ],
        ),
        (
            "Multi Vessel Encounter Assessment", "MVE-001",
            "COLREG", "Multi Vessel Encounter", "Expert", 80, 60,
            ["Collision Avoidance", "Situational Awareness", "Decision Making", "Rule Compliance"],
            [
                ("Three Vessel Day Encounter", "MVE-001-V1", ep(0), port(0), vessel(0), vessel(2), vessel(7), 60),
                ("Night Multi-Vessel",         "MVE-001-V2", ep(2), port(0), vessel(0), vessel(2), vessel(7), 60),
            ],
        ),
    ]

    for ex_name, ex_code, cat_key, scen_key, diff, passing, duration, obj_keys, variants in exercises_data:
        ex = Exercise(
            uuid=uid(),
            exercise_name=ex_name,
            exercise_code=ex_code,
            category_id=cats[cat_key].id if cat_key in cats else None,
            scenario_id=scens[scen_key].id if scen_key in scens else None,
            description=f"Assessment exercise: {ex_name}.",
            difficulty=diff,
            passing_score=passing,
            max_attempts=3,
            estimated_duration=duration,
            generation_mode="MANUAL",
            status="active",
            version_number=1,
        )
        session.add(ex)
        await session.flush()

        for obj_key in obj_keys:
            if obj_key in objs:
                session.add(ExerciseObjective(exercise_id=ex.id, objective_id=objs[obj_key].id))

        version = ExerciseVersion(exercise_id=ex.id, version_number=1, change_summary="Initial version")
        session.add(version)

        for v_name, v_code, env_id, p_id, pv_id, sv_id, tv_id, dur in variants:
            var = ExerciseVariant(
                uuid=uid(), variant_name=v_name, variant_code=v_code,
                exercise_id=ex.id, port_id=p_id,
                environment_profile_id=env_id, primary_vessel_id=pv_id,
                secondary_vessel_id=sv_id, tertiary_vessel_id=tv_id,
                duration_minutes=dur, passing_score=passing,
                description=f"Variant: {v_name}.", status="active",
            )
            session.add(var)

    await session.flush()
    log.info("Seeded %d exercises with variants", len(exercises_data))


# ── Main ───────────────────────────────────────────────────────────────────

async def main() -> None:
    log.info("Starting exercise data flush + seed...")
    async with DB() as session:
        async with session.begin():
            await flush_all(session)
            cats = await seed_categories(session)
            objs = await seed_objectives(session)
            scens = await seed_scenarios(session)
            await seed_exercises_and_variants(session, cats, objs, scens)
    log.info("Exercise seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
