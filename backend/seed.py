"""
Database seeder — run once after migrations.
Creates: plans, roles, all permissions, role-permission mappings, super admin user.

Usage: cd backend && python seed.py
"""
import asyncio
import logging
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.constants.permissions import ALL_PERMISSIONS, SUPER_ADMIN_PERMISSIONS, ORG_ADMIN_PERMISSIONS, CANDIDATE_PERMISSIONS
from app.models.permission import Permission
from app.models.plan import Plan
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.models.user_role import UserRole
from app.models.assessment import Assessment

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("seed")

engine = create_async_engine(settings.async_database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def seed_plans(session: AsyncSession) -> None:
    existing = (await session.execute(select(Plan))).scalars().all()
    if existing:
        log.info("Plans already seeded (%d found)", len(existing))
        return
    plans = [
        Plan(uuid=str(uuid.uuid4()), name="Starter", slug="starter", price_monthly=99, price_yearly=990, max_users=5, max_simulators=1, sort_order=1),
        Plan(uuid=str(uuid.uuid4()), name="Professional", slug="professional", price_monthly=299, price_yearly=2990, max_users=25, max_simulators=5, sort_order=2),
        Plan(uuid=str(uuid.uuid4()), name="Enterprise", slug="enterprise", price_monthly=799, price_yearly=7990, max_users=100, max_simulators=20, sort_order=3),
        Plan(uuid=str(uuid.uuid4()), name="Trial", slug="trial", price_monthly=0, price_yearly=0, max_users=3, max_simulators=1, is_trial=True, trial_days=14, sort_order=0),
    ]
    session.add_all(plans)
    await session.flush()
    log.info("Seeded %d plans", len(plans))


async def seed_permissions(session: AsyncSession) -> dict[str, Permission]:
    existing = {p.name: p for p in (await session.execute(select(Permission))).scalars().all()}
    perm_map: dict[str, Permission] = dict(existing)
    created = 0
    for pdef in ALL_PERMISSIONS:
        if pdef.name not in existing:
            p = Permission(
                uuid=str(uuid.uuid4()),
                name=pdef.name,
                slug=pdef.name.replace(".", "_"),
                module=pdef.module,
                action=pdef.action,
                description=pdef.description,
            )
            session.add(p)
            await session.flush()
            perm_map[pdef.name] = p
            created += 1
    log.info("Permissions: %d already existed, %d created", len(existing), created)
    return perm_map


async def seed_roles(session: AsyncSession, perm_map: dict[str, Permission]) -> dict[str, Role]:
    existing = {r.slug: r for r in (await session.execute(select(Role))).scalars().all()}
    role_map: dict[str, Role] = dict(existing)

    role_defs = [
        ("Super Admin", "super_admin", "Full platform access", SUPER_ADMIN_PERMISSIONS),
        ("Organization Admin", "org_admin", "Organization-level management access", ORG_ADMIN_PERMISSIONS),
        ("Candidate", "candidate", "Candidate access to assessments and exercises", CANDIDATE_PERMISSIONS),
    ]
    for name, slug, desc, perm_names in role_defs:
        if slug not in existing:
            role = Role(uuid=str(uuid.uuid4()), name=name, slug=slug, description=desc, is_system=True)
            session.add(role)
            await session.flush()
            role_map[slug] = role
            log.info("Created role: %s", slug)
        else:
            role = existing[slug]

        # Ensure role-permission assignments are up to date
        current_rp = (await session.execute(
            select(RolePermission).where(RolePermission.role_id == role.id)
        )).scalars().all()
        current_pids = {rp.permission_id for rp in current_rp}
        for pname in perm_names:
            perm = perm_map.get(pname)
            if perm and perm.id not in current_pids:
                session.add(RolePermission(role_id=role.id, permission_id=perm.id))
    await session.flush()
    return role_map


async def seed_super_admin(session: AsyncSession, role_map: dict[str, Role]) -> None:
    existing = (await session.execute(
        select(User).where(User.email == settings.SUPER_ADMIN_EMAIL)
    )).scalar_one_or_none()

    if existing:
        log.info("Super admin already exists: %s", settings.SUPER_ADMIN_EMAIL)
        return

    admin = User(
        uuid=str(uuid.uuid4()),
        email=settings.SUPER_ADMIN_EMAIL,
        full_name=settings.SUPER_ADMIN_NAME,
        hashed_password=hash_password(settings.SUPER_ADMIN_PASSWORD),
        status="active",
        is_active=True,
    )
    session.add(admin)
    await session.flush()

    super_admin_role = role_map.get("super_admin")
    if super_admin_role:
        session.add(UserRole(user_id=admin.id, role_id=super_admin_role.id, created_by=admin.uuid))
    await session.flush()
    log.info("Super admin created: %s", settings.SUPER_ADMIN_EMAIL)


async def seed_assessments(session: AsyncSession) -> None:
    existing = (await session.execute(select(Assessment))).scalars().all()
    if existing:
        log.info("Assessments already seeded (%d found)", len(existing))
        return
    assessments = [
        Assessment(
            uuid=str(uuid.uuid4()), assessment_code="COLREG-2026-001",
            assessment_name="COLREG Rules of the Road — Annual Evaluation",
            assessment_type="Evaluation", status="active",
            description="Comprehensive evaluation covering the International Regulations for Preventing Collisions at Sea (COLREGs), including vessel lighting, sound signals, and traffic separation schemes.",
            passing_score=80.0, max_attempts=3, duration_minutes=90,
            instructions="Candidates must score 80% or above. Each section must be completed within the allotted time. Calculators are not permitted.",
        ),
        Assessment(
            uuid=str(uuid.uuid4()), assessment_code="EMRG-2026-001",
            assessment_name="Emergency Response Procedures — Certification",
            assessment_type="Certification", status="active",
            description="Certification assessment for emergency response aboard maritime vessels. Covers man overboard, fire-fighting procedures, engine failure, and crisis communication.",
            passing_score=85.0, max_attempts=2, duration_minutes=120,
            certificate_eligible=True, certificate_validity_months=24,
            instructions="This is a proctored certification assessment. All scenarios must be completed sequentially. Retakes require a 30-day waiting period.",
        ),
        Assessment(
            uuid=str(uuid.uuid4()), assessment_code="BRM-2026-001",
            assessment_name="Bridge Resource Management — Training Assessment",
            assessment_type="Training", status="active",
            description="Training assessment for bridge resource management, covering crew coordination, situational awareness, communication protocols, and decision-making under stress.",
            passing_score=75.0, max_attempts=5, duration_minutes=60,
            randomize_exercise_order=True,
            instructions="This is a formative training assessment. Candidates are encouraged to review feedback after each attempt to improve their bridge resource management skills.",
        ),
        Assessment(
            uuid=str(uuid.uuid4()), assessment_code="PORT-2026-001",
            assessment_name="Port Operations & Pilotage — Practice Set",
            assessment_type="Practice", status="active",
            description="Practice scenarios for port entry, exit, pilotage, and berthing procedures. Suitable for officers preparing for the Port Operations certification.",
            passing_score=70.0, max_attempts=10, duration_minutes=45,
            instructions="No time limit enforced for practice. Review all scenario outcomes before proceeding to the certification assessment.",
        ),
        Assessment(
            uuid=str(uuid.uuid4()), assessment_code="MANOEUVRE-2026-001",
            assessment_name="Shiphandling & Manoeuvring — Advanced Evaluation",
            assessment_type="Evaluation", status="draft",
            description="Advanced evaluation of ship control, propulsion response, and close-quarters manoeuvring in restricted waters. Includes confined channel navigation and deadweight scenarios.",
            passing_score=82.0, max_attempts=2, duration_minutes=75,
            randomize_exercise_order=True, randomize_variant_selection=True,
            instructions="Evaluation is conducted in the high-fidelity ship simulator. Candidates are assessed on both technical accuracy and decision timing.",
        ),
        Assessment(
            uuid=str(uuid.uuid4()), assessment_code="TSS-2026-001",
            assessment_name="Traffic Separation Schemes — Navigation Competency",
            assessment_type="Training", status="archived",
            description="Navigation competency assessment covering traffic separation schemes, vessel routeing measures, and associated COLREGs requirements in high-traffic waterways.",
            passing_score=78.0, max_attempts=3, duration_minutes=50,
            instructions="Archived — superseded by COLREG-2026-001. Retained for historical reference only.",
        ),
    ]
    session.add_all(assessments)
    await session.flush()
    log.info("Seeded %d assessments", len(assessments))


async def main() -> None:
    log.info("Starting database seed...")
    async with AsyncSessionLocal() as session:
        async with session.begin():
            await seed_plans(session)
            perm_map = await seed_permissions(session)
            role_map = await seed_roles(session, perm_map)
            await seed_super_admin(session, role_map)
            await seed_assessments(session)
    log.info("Seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
