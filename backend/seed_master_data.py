"""
Master Data seeder — flush and re-seed all 7 master data tables with
realistic maritime training data.

Tables (in dependency order):
  1. time_of_day
  2. weather_conditions
  3. sea_states
  4. visibility_conditions
  5. environment_profiles  (FKs -> 1-4)
  6. vessels
  7. ports

Usage: cd backend && python seed_master_data.py
"""
import asyncio
import logging
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import delete, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.environment_profile import EnvironmentProfile
from app.models.port import Port
from app.models.sea_state import SeaState
from app.models.time_of_day import TimeOfDay
from app.models.vessel import Vessel
from app.models.visibility_condition import VisibilityCondition
from app.models.weather_condition import WeatherCondition

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("seed_master")

engine = create_async_engine(settings.async_database_url, echo=False)
DB = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


def uid() -> str:
    return str(uuid.uuid4())


# ── Flush ──────────────────────────────────────────────────────────────────

async def flush_all(session: AsyncSession) -> None:
    counts = {}
    for Model, tbl in [
        (EnvironmentProfile,  "environment_profiles"),
        (Vessel,              "vessels"),
        (Port,                "ports"),
        (VisibilityCondition, "visibility_conditions"),
        (SeaState,            "sea_states"),
        (WeatherCondition,    "weather_conditions"),
        (TimeOfDay,           "time_of_day"),
    ]:
        r = await session.execute(delete(Model))
        counts[tbl] = r.rowcount
        await session.execute(text(f"ALTER SEQUENCE IF EXISTS {tbl}_id_seq RESTART WITH 1"))
    log.info("Flushed: %s", counts)


# ── 1. Time of Day ─────────────────────────────────────────────────────────

TIME_OF_DAY = [
    ("Pre-Dawn", "Period between midnight and civil twilight (~00:00–06:00). Lowest ambient light; high fatigue risk for watchkeepers."),
    ("Dawn",     "Civil twilight to sunrise (~06:00–07:00). Light rapidly increasing; radar-to-visual transition required."),
    ("Day",      "Full daylight hours (~07:00–17:00). Normal visual watchkeeping conditions."),
    ("Dusk",     "Sunset to end of civil twilight (~17:00–19:00). Contrast reduction; transition to navigation lights."),
    ("Evening",  "Post-twilight to late evening (~19:00–22:00). Navigation lights active; moderate traffic on major routes."),
    ("Night",    "Late evening to midnight (~22:00–00:00). Full night conditions; lights, radar, and ECDIS primary references."),
]

async def seed_time_of_day(session: AsyncSession) -> dict[str, TimeOfDay]:
    objs: dict[str, TimeOfDay] = {}
    for name, desc in TIME_OF_DAY:
        o = TimeOfDay(uuid=uid(), name=name, description=desc, status="active")
        session.add(o)
        await session.flush()
        objs[name] = o
    log.info("Seeded %d time-of-day entries", len(objs))
    return objs


# ── 2. Weather Conditions ──────────────────────────────────────────────────
# (name, wind_speed kn, precipitation_level, visibility_range NM, description)

WEATHER = [
    ("Clear",            5.0, "None",     10.0, "Cloudless sky, excellent visibility. Ideal for visual watchkeeping and chart training."),
    ("Partly Cloudy",   10.0, "None",     10.0, "Light cloud cover, no precipitation. Standard offshore transit conditions."),
    ("Overcast",        18.0, "None",      8.0, "Heavy cloud cover, no rain. Diffused light reduces contrast for visual bearings."),
    ("Light Rain",      14.0, "Light",     5.0, "Scattered showers with moderate winds. Radar use recommended to supplement visual watch."),
    ("Moderate Rain",   22.0, "Moderate",  3.0, "Persistent rainfall with fresh winds. Visibility degraded; ECDIS cross-check essential."),
    ("Heavy Rain",      30.0, "Heavy",     1.5, "Intense rainfall limiting deck visibility. Sea clutter reduces radar effectiveness."),
    ("Thunderstorm",    45.0, "Heavy",     0.5, "Severe convective activity with lightning risk. Waterspout possible; all navigational aids active."),
    ("Fog",              8.0, "None",      0.5, "Advection or radiation fog. Sound signals per COLREGS Rule 35; speed reduced to safe speed."),
    ("Dense Fog",        4.0, "None",      0.1, "Visibility below 0.1 NM. Proceed at safe speed; anchoring may be appropriate."),
    ("Light Snow",      15.0, "Light",     2.0, "Snow showers in northern latitudes. Icing possible on open decks and antenna gear."),
    ("Gale",            40.0, "Moderate",  4.0, "Force 8–9 winds. Heavy spray; hazardous to small vessels and deck operations."),
    ("Tropical Cyclone",65.0, "Extreme",   0.3, "Sustained winds >= 64 kn. Extreme sea states; avoid if at all possible."),
]

async def seed_weather(session: AsyncSession) -> dict[str, WeatherCondition]:
    objs: dict[str, WeatherCondition] = {}
    for name, wind, precip, vis, desc in WEATHER:
        o = WeatherCondition(uuid=uid(), name=name, wind_speed=wind,
                             precipitation_level=precip, visibility_range=vis,
                             description=desc, status="active")
        session.add(o)
        await session.flush()
        objs[name] = o
    log.info("Seeded %d weather conditions", len(objs))
    return objs


# ── 3. Sea States (Douglas Scale 0–9) ──────────────────────────────────────

SEA_STATES = [
    # (name, min_m, max_m or None, description)
    ("Glassy",      0.0,   0.0,  "Douglas Scale 0. Mirror-like surface, no swell. Exceptional manoeuvring and anchor work."),
    ("Rippled",     0.0,   0.1,  "Douglas Scale 1. Small wavelets, no foam crests. Calm conditions close inshore."),
    ("Wavelet",     0.1,   0.5,  "Douglas Scale 2. Short wavelets, glassy crests not breaking. Comfortable for all vessels."),
    ("Slight",      0.5,   1.25, "Douglas Scale 3. Large wavelets, scattered whitecaps. Normal coastal navigation."),
    ("Moderate",    1.25,  2.5,  "Douglas Scale 4. Longer waves, frequent whitecaps, some spray. Affects small craft."),
    ("Rough",       2.5,   4.0,  "Douglas Scale 5. Moderately high waves, spray. Deck operations become hazardous."),
    ("Very Rough",  4.0,   6.0,  "Douglas Scale 6. Heaping sea, foam blown in well-marked streaks. Significant vessel motion."),
    ("High",        6.0,   9.0,  "Douglas Scale 7. Sea heaps up; wind streaks on foam. Large vessels affected."),
    ("Very High",   9.0,  14.0,  "Douglas Scale 8. Very high waves, overhanging crests; visibility severely reduced."),
    ("Phenomenal", 14.0,  None,  "Douglas Scale 9. Exceptional waves exceeding 14 m. Extreme danger to all vessels."),
]

async def seed_sea_states(session: AsyncSession) -> dict[str, SeaState]:
    objs: dict[str, SeaState] = {}
    for name, mn, mx, desc in SEA_STATES:
        o = SeaState(uuid=uid(), name=name, wave_height_min=mn,
                     wave_height_max=mx, description=desc, status="active")
        session.add(o)
        await session.flush()
        objs[name] = o
    log.info("Seeded %d sea states", len(objs))
    return objs


# ── 4. Visibility Conditions ───────────────────────────────────────────────

VISIBILITY = [
    ("Dense Fog",  0.05, "Visibility < 0.05 NM. Sound signals mandatory; engine on standby; anchoring may be required."),
    ("Thick Fog",  0.2,  "Visibility 0.05–0.2 NM. Proceed at safe speed; radar watch essential; fog signals active."),
    ("Fog",        0.5,  "Visibility 0.2–0.5 NM. Reduced speed; radar and AIS tracking; Rule 35 sound signals required."),
    ("Mist",       1.0,  "Visibility 0.5–1.0 NM. Enhanced radar watch; caution near traffic separation schemes."),
    ("Poor",       2.0,  "Visibility 1.0–2.0 NM. Precautionary speed reduction; heightened radar watch."),
    ("Moderate",   5.0,  "Visibility 2.0–5.0 NM. Normal watchkeeping; radar confirmation of targets recommended."),
    ("Good",      10.0,  "Visibility 5.0–10.0 NM. Good visual range; standard watchkeeping procedures."),
    ("Excellent", 20.0,  "Visibility > 10 NM. Maximum visual range; optimal for celestial and visual fix training."),
]

async def seed_visibility(session: AsyncSession) -> dict[str, VisibilityCondition]:
    objs: dict[str, VisibilityCondition] = {}
    for name, dist, desc in VISIBILITY:
        o = VisibilityCondition(uuid=uid(), name=name, visibility_distance=dist,
                                description=desc, status="active")
        session.add(o)
        await session.flush()
        objs[name] = o
    log.info("Seeded %d visibility conditions", len(objs))
    return objs


# ── 5. Environment Profiles ────────────────────────────────────────────────

async def seed_env_profiles(
    session: AsyncSession,
    wx: dict[str, WeatherCondition],
    ss: dict[str, SeaState],
    vc: dict[str, VisibilityCondition],
    tod: dict[str, TimeOfDay],
) -> None:
    profiles = [
        # Ideal / Training baseline
        ("Clear Day — Open Ocean",
         "Clear",        "Slight",     "Excellent",  "Day",
         "Ideal baseline for initial navigation exercises. Maximum sensory input; no environmental stressors."),
        ("Clear Day — Coastal Passage",
         "Partly Cloudy","Slight",     "Good",       "Day",
         "Typical coastal transit in good weather. Traffic density and pilotage hazards provide realistic workload."),
        ("Clear Night — Deep Sea",
         "Clear",        "Moderate",   "Good",       "Night",
         "Night ocean transit with good visibility. Tests celestial navigation awareness and night watchkeeping."),
        ("Dawn Watch Handover",
         "Partly Cloudy","Slight",     "Good",       "Dawn",
         "Critical handover period at sunrise. Assesses vigilance and situational awareness during light transition."),
        ("Evening Port Approach",
         "Clear",        "Rippled",    "Good",       "Evening",
         "Inbound port approach at dusk. Navigation lights active; reduced depth perception and contrast."),
        # Reduced visibility
        ("Coastal Fog — Restricted Visibility",
         "Fog",          "Slight",     "Fog",        "Dawn",
         "Early morning advection fog on coastal passage. Sound signals, radar plot, and speed reduction required."),
        ("Dense Fog — Port Approaches",
         "Dense Fog",    "Rippled",    "Dense Fog",  "Pre-Dawn",
         "Pre-dawn dense fog near busy port approaches. Radar, AIS, and pilot communication are primary tools."),
        ("Mist — Night Coastal",
         "Overcast",     "Moderate",   "Mist",       "Night",
         "Night passage with light mist. Navigation lights and radar provide primary collision-avoidance data."),
        # Heavy weather
        ("Heavy Weather — Open Ocean Transit",
         "Gale",         "Very Rough", "Poor",       "Day",
         "Force 8 gale in open ocean. Tests heavy-weather procedures, course/speed adjustments, and BRM."),
        ("Storm — North Atlantic",
         "Heavy Rain",   "High",       "Moderate",   "Night",
         "Night storm transit. Significant vessel motion; radar clutter; all officers at heightened readiness."),
        ("Tropical Cyclone — Avoidance",
         "Tropical Cyclone","Phenomenal","Poor",     "Day",
         "Extreme weather scenario for advanced officer training. Decision-making under maximum environmental stress."),
        ("Post-Storm — Recovery",
         "Overcast",     "Rough",      "Good",       "Day",
         "Elevated sea state after storm passage. Swell running contrary to wind; debris risk; fatigue management."),
        # Special scenarios
        ("Thunderstorm — Coastal",
         "Thunderstorm", "Moderate",   "Mist",       "Evening",
         "Severe convective storm close to coast. Tests decision-making on seeking shelter vs. continuing transit."),
        ("Arctic — Snow and Ice",
         "Light Snow",   "Moderate",   "Poor",       "Day",
         "High-latitude operations with snow and potential ice accretion. Extra monitoring of machinery and decks."),
        ("Night Port Entry — Clear",
         "Clear",        "Rippled",    "Excellent",  "Night",
         "Night approach and berthing exercise. Pilot ladder, tug coordination, and VHF communications."),
        ("Restricted Visibility — TSS Crossing",
         "Fog",          "Slight",     "Fog",        "Day",
         "Fog crossing of a traffic separation scheme. Full COLREGS Part B Section III application required."),
        ("Man Overboard — Day",
         "Moderate Rain","Rough",      "Moderate",   "Day",
         "MOB scenario in deteriorating weather. Tests Williamson Turn, lookout deployment, GMDSS alerting."),
        ("Man Overboard — Night",
         "Overcast",     "Moderate",   "Mist",       "Night",
         "Night MOB exercise. Adds searchlight use, SART detection, and lifeboat readiness to standard procedure."),
        ("Anchor Watch — Deteriorating",
         "Gale",         "Rough",      "Poor",       "Night",
         "Vessel at anchor with deteriorating weather. Drag monitoring, engine readiness, and emergency anchorage."),
        ("VTS Zone — High Traffic",
         "Partly Cloudy","Slight",     "Good",       "Day",
         "Passage through a VTS area in a busy shipping lane. Radio procedures, reporting points, and compliance."),
    ]

    for name, w_name, s_name, v_name, t_name, desc in profiles:
        o = EnvironmentProfile(
            uuid=uid(), profile_name=name,
            weather_condition_id=wx[w_name].id,
            sea_state_id=ss[s_name].id,
            visibility_condition_id=vc[v_name].id,
            time_of_day_id=tod[t_name].id,
            description=desc, status="active",
        )
        session.add(o)
    await session.flush()
    log.info("Seeded %d environment profiles", len(profiles))


# ── 6. Vessels ─────────────────────────────────────────────────────────────
# (name, code, type, imo_cat, length, beam, draft, max_speed_kn, maneuvering, description)

VESSELS = [
    # Container Ships
    ("MV Meridian Star",       "MV-MSTR-001",  "Container Vessel",  "Class I",  364.0, 51.2, 15.5, 24.0, "Good",      "Ultra-large container vessel (ULCV), 24 000 TEU capacity. Used for advanced BRM and long-range passage planning exercises."),
    ("MV Horizon Trader",      "MV-HTRDR-001", "Container Vessel",  "Class I",  299.9, 48.2, 14.2, 22.5, "Good",      "Large container ship on Asia-Europe feeder routes. Representative of high-traffic TSS and port approach scenarios."),
    ("MV Pacific Relay",       "MV-PRLY-001",  "Container Vessel",  "Class II", 218.0, 32.2, 10.5, 19.0, "Good",      "Medium feeder vessel for intra-Asia service. Suitable for coastal navigation and harbour manoeuvring exercises."),
    ("MV Straits Express",     "MV-STREX-001", "Container Vessel",  "Class II", 175.0, 27.4,  9.2, 18.5, "Good",      "Short-sea feeder container vessel. Ideal for Strait of Malacca, ECDIS route, and traffic separation exercises."),
    # Oil Tankers
    ("MT Aegean Phoenix",      "MT-APHO-001",  "Oil Tanker",        "Class I",  330.0, 60.0, 21.0, 15.5, "Fair",      "VLCC (Very Large Crude Carrier), 300 000 DWT. Deep-water approach, anchorage, and MARPOL compliance training."),
    ("MT Coastal Endeavour",   "MT-CEND-001",  "Oil Tanker",        "Class II", 244.0, 42.0, 14.8, 14.8, "Fair",      "Aframax crude tanker for port approach, mooring, and crude oil transfer exercises."),
    ("MT Strait Pioneer",      "MT-SPIR-001",  "Oil Tanker",        "Class III",183.0, 32.2, 12.5, 14.0, "Good",      "Product tanker (MR class) for coastal and short-sea passages. Chemical and product transfer simulations."),
    # Bulk Carriers
    ("MV Cape Resolute",       "MV-CRES-001",  "Bulk Carrier",      "Class I",  292.0, 45.0, 18.2, 14.5, "Fair",      "Capesize bulk carrier, 180 000 DWT. Restricted-water manoeuvring near ore terminals and anchorages."),
    ("MV Panamax Alliance",    "MV-PAL-001",   "Bulk Carrier",      "Class II", 225.0, 32.3, 14.3, 13.8, "Fair",      "Panamax bulk carrier for Panama Canal and large port approach exercises including lock transit."),
    ("MV Handymax Spirit",     "MV-HMAX-001",  "Bulk Carrier",      "Class III",190.0, 32.0, 12.0, 14.0, "Good",      "Supramax bulk carrier. Versatile for coastal, anchorage, and grain terminal exercises."),
    ("MV Tropic Merchant",     "MV-TMRC-001",  "Bulk Carrier",      "Class III",142.0, 22.0,  8.5, 14.0, "Excellent", "Handysize general cargo vessel. Ideal for coastal passage and cargo ops in smaller ports."),
    # LNG / LPG Carriers
    ("LNG Polaris",            "LNG-POL-001",  "LNG Carrier",       "Class I",  295.0, 46.0, 11.8, 19.5, "Good",      "Q-Flex LNG carrier, 216 000 m3. High-value cargo handling, loading arm operations, and QHM liaison training."),
    ("LPG Aurora",             "LPG-AUR-001",  "Chemical Tanker",   "Class II", 230.0, 36.6, 11.2, 17.0, "Good",      "VLGC LPG carrier. Gas handling safety, terminal interface, and emergency shutdown procedures."),
    # Ro-Ro / Vehicle Carrier
    ("MV Euro Highway",        "MV-EHWY-001",  "Bulk Carrier",      "Class II", 228.0, 32.5,  8.8, 20.5, "Good",      "Pure Car and Truck Carrier (PCTC). Stability, lashing, and enclosed-space entry exercises."),
    # Ferry / Passenger
    ("MV Adriatic Pearl",      "MV-APRL-001",  "Ferry",             "Class II", 215.0, 30.0,  6.8, 27.0, "Excellent", "Passenger/Ro-Pax ferry on short-sea crossings. Crowd management, muster, and terminal approach training."),
    ("MV Island Star",         "MV-ISTR-001",  "Ferry",             "Class III", 95.0, 18.0,  3.8, 22.0, "Excellent", "Small island ferry for port-hopping exercises. Tight manoeuvring and passenger safety focus."),
    # Offshore Vessels
    ("PSV North Sea Provider", "PSV-NSP-001",  "Offshore Vessel",   "Class II",  94.0, 21.0,  6.0, 13.5, "Excellent", "Platform Supply Vessel with DP2 capability. DP operations, anchor handling, and offshore field arrival exercises."),
    ("AHTS Resolve",           "AHTS-RSV-001", "Offshore Vessel",   "Class II",  91.0, 23.0,  6.2, 14.0, "Excellent", "Anchor Handling Tug Supply vessel. Anchor deployment patterns and towing exercises in offshore context."),
    # Tugs
    ("TUG Harbour Master",     "TUG-HBM-001",  "Tug",               None,        43.0, 13.0,  5.5, 13.0, "Excellent", "Azimuth stern drive (ASD) harbour tug. Assist manoeuvres, emergency towing, and berthing operations."),
    ("TUG Pacific Force",      "TUG-PCF-001",  "Tug",               None,        58.0, 15.5,  6.2, 14.0, "Excellent", "Ocean-going tug for salvage and long-distance towing exercises."),
    # Fishing / Specialist
    ("FV Atlantic Dawn",       "FV-ATDW-001",  "Fishing Vessel",    None,        80.0, 16.0,  6.8, 12.0, "Fair",      "Large stern trawler for fishing vessel encounter scenarios and COLREGS Rule 26 application exercises."),
    ("TV Naviora Cadet",       "TV-NCD-001",   "Bulk Carrier",      None,       135.0, 20.0,  6.5, 15.0, "Good",      "Dedicated training vessel for hands-on cadet watchkeeping, celestial navigation, and cargo operations."),
]

async def seed_vessels(session: AsyncSession) -> None:
    for name, code, vtype, imo, length, beam, draft, speed, manu, desc in VESSELS:
        o = Vessel(
            uuid=uid(), vessel_name=name, vessel_code=code, vessel_type=vtype,
            imo_category=imo, length=length, beam=beam, draft=draft,
            max_speed=speed, maneuverability_rating=manu,
            description=desc, status="active",
        )
        session.add(o)
    await session.flush()
    log.info("Seeded %d vessels", len(VESSELS))


# ── 7. Ports ───────────────────────────────────────────────────────────────
# (name, code, country, city, lat, lon, traffic, description)

PORTS = [
    # Asia-Pacific
    ("Port of Singapore",           "SGSIN", "Singapore",     "Singapore",       1.264900,  103.820700, "Very High", "World's busiest transshipment hub; Strait of Malacca gateway. Primary hub for VLCC, container, and LNG routes."),
    ("Port of Shanghai",            "CNSHA", "China",         "Shanghai",       31.380000,  121.500000, "Very High", "World's largest container port by volume. Yangtze River delta; complex VTS and pilotage environment."),
    ("Port of Shenzhen",            "CNSZU", "China",         "Shenzhen",       22.519400,  114.055600, "Very High", "Major Pearl River Delta container complex including Yantian, Shekou, and Dachanwan terminals."),
    ("Port of Ningbo-Zhoushan",     "CNNBO", "China",         "Ningbo",         29.900000,  121.700000, "Very High", "Second-busiest port in China; crude oil, iron ore, and container handling with complex anchorage areas."),
    ("Port of Busan",               "KRPUS", "South Korea",   "Busan",          35.096100,  129.041700, "High",      "South Korea's largest port and a major transshipment hub for Northeast Asia container traffic."),
    ("Port of Hong Kong",           "HKHKG", "Hong Kong",     "Hong Kong",      22.280000,  114.165000, "Very High", "Historic deep-water port with container, Ro-Ro, and passenger operations in Pearl River estuary."),
    ("Port Klang",                  "MYPKG", "Malaysia",      "Klang",           3.016700,  101.383300, "High",      "Malaysia's principal port; gateway for import-export cargo on the southern Strait of Malacca."),
    ("Port of Tanjung Pelepas",     "MYMYY", "Malaysia",      "Johor",           1.366700,  103.550000, "High",      "Major Malaysian transshipment terminal at the southern tip of the Malay Peninsula."),
    ("Port of Colombo",             "LKCMB", "Sri Lanka",     "Colombo",         6.942000,   79.843000, "High",      "South Asia's leading transshipment hub located on the key East-West trade lane."),
    ("Jawaharlal Nehru Port",       "INNSA", "India",         "Mumbai",         18.948400,   72.952500, "High",      "India's largest container port handling a significant share of the country's containerised foreign trade."),
    ("Port of Yokohama",            "JPYOK", "Japan",         "Yokohama",       35.444400,  139.643100, "High",      "Japan's primary container port forming part of the combined Tokyo Bay port complex."),
    ("Port of Sydney",              "AUSYD", "Australia",     "Sydney",        -33.861400,  151.210800, "Medium",    "Australia's premier gateway port; container, cruise, and general cargo in a natural deep-water harbour."),
    ("Port of Kaohsiung",           "TWKHH", "Taiwan",        "Kaohsiung",      22.622500,  120.282200, "High",      "Taiwan's largest port and a key Asia transshipment hub for intra-regional feeder services."),
    # Europe
    ("Port of Rotterdam",           "NLRTM", "Netherlands",   "Rotterdam",      51.920000,    4.476700, "Very High", "Europe's busiest port and primary gateway for Rhine-Scheldt inland waterway system."),
    ("Port of Antwerp-Bruges",      "BEANR", "Belgium",       "Antwerp",        51.321700,    4.319900, "Very High", "Europe's second-largest container port; major chemical, general cargo, and Ro-Ro facility."),
    ("Port of Hamburg",             "DEHAM", "Germany",       "Hamburg",        53.541400,    9.989900, "High",      "Germany's largest port; container and Ro-Ro operations on the tidal Elbe River."),
    ("Port of Felixstowe",          "GBFXT", "United Kingdom","Felixstowe",     51.963600,    1.325800, "High",      "UK's busiest container port; primary deep-sea gateway for UK-Asia and UK-Europe trade."),
    ("Port of Piraeus",             "GRPIR", "Greece",        "Piraeus",        37.944700,   23.638300, "High",      "Largest port in Greece and one of the biggest container ports in the Mediterranean."),
    ("Port of Barcelona",           "ESBCN", "Spain",         "Barcelona",      41.345300,    2.167200, "High",      "Major Spanish container, cruise, and Ro-Ro port; western Mediterranean transshipment gateway."),
    ("Port of Genoa",               "ITGOA", "Italy",         "Genoa",          44.408300,    8.932200, "Medium",    "Italy's largest seaport by freight volume; container, Ro-Ro, and cruise operations."),
    ("Port of Marseille-Fos",       "FRMRS", "France",        "Marseille",      43.339700,    5.211900, "High",      "France's largest port; petroleum, container, and bulk cargo on the Gulf of Lion."),
    # Middle East & Africa
    ("Port of Jebel Ali",           "AEJEA", "UAE",           "Dubai",          24.986400,   55.057700, "Very High", "Middle East's largest container port; DP World flagship terminal serving Gulf and South Asia trade."),
    ("Port of Salalah",             "OMSAL", "Oman",          "Salalah",        16.944000,   54.007000, "High",      "Key Indian Ocean transshipment port; growing hub on Africa-Asia and Asia-Europe trade lanes."),
    ("Port Said",                   "EGPSD", "Egypt",         "Port Said",      31.256700,   32.283300, "High",      "Northern entrance to the Suez Canal; canal transit staging, bunkering, and container operations."),
    ("Port of Durban",              "ZADUR", "South Africa",  "Durban",        -29.869700,   31.024400, "High",      "Africa's busiest port; container, bulk, and automotive cargo on the east coast."),
    ("Port of Cape Town",           "ZACPT", "South Africa",  "Cape Town",     -33.906100,   18.424700, "Medium",    "Primary South African west-coast port; container and breakbulk; Cape of Good Hope routing."),
    # Americas
    ("Port of Los Angeles",         "USLAX", "USA",           "Los Angeles",    33.729100, -118.259100, "Very High", "USA's busiest container port; Trans-Pacific trade gateway on the Southern California coast."),
    ("Port of New York & New Jersey","USNYC", "USA",          "New York",       40.685600,  -74.043900, "Very High", "US East Coast's largest port; container, tanker, and Ro-Ro in Upper New York Bay."),
    ("Port of Houston",             "USHOU", "USA",           "Houston",        29.763700,  -95.160300, "High",      "USA's leading petrochemical and energy port complex along the Houston Ship Channel."),
    ("Port of Santos",              "BRSSZ", "Brazil",        "Santos",        -23.946100,  -46.337100, "High",      "South America's busiest port; container and agricultural bulk exports from Brazil."),
    ("Port of Colon",               "PAONX", "Panama",        "Colon",           9.357500,  -79.902300, "High",      "Atlantic entrance of the Panama Canal; transshipment hub for Americas and canal transit staging."),
]

async def seed_ports(session: AsyncSession) -> None:
    for pname, code, country, city, lat, lon, traffic, desc in PORTS:
        o = Port(
            uuid=uid(), port_name=pname, port_code=code,
            country=country, city=city,
            latitude=lat, longitude=lon,
            traffic_density=traffic, description=desc, status="active",
        )
        session.add(o)
    await session.flush()
    log.info("Seeded %d ports", len(PORTS))


# ── Main ───────────────────────────────────────────────────────────────────

async def main() -> None:
    log.info("Starting master data flush + seed...")
    async with DB() as session:
        async with session.begin():
            await flush_all(session)
            tod = await seed_time_of_day(session)
            wx  = await seed_weather(session)
            ss  = await seed_sea_states(session)
            vc  = await seed_visibility(session)
            await seed_env_profiles(session, wx, ss, vc, tod)
            await seed_vessels(session)
            await seed_ports(session)
    log.info("Master data seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
