"""Dashboard summary schemas."""
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_organizations: int = 0
    active_organizations: int = 0
    total_users: int = 0
    active_users: int = 0
    total_assessments: int = 0
    total_simulator_sessions: int = 0
    pending_enquiries: int = 0
    active_plans: int = 0


class DashboardCard(BaseModel):
    label: str
    value: int
    change: float = 0.0
    change_label: str = ""
