"""Manual connector — instructor-managed assessment completion."""
from typing import Any

from app.connectors.base import BaseSimulatorConnector


class ManualSimulatorConnector(BaseSimulatorConnector):
    """Connector for manually-administered assessments.

    Used when no simulator integration exists. The instructor marks
    the assessment as Pass/Fail with optional remarks.
    """

    async def launch_session(self, payload: dict[str, Any]) -> dict[str, Any]:
        self._log("info", "launch_session (manual mode)")
        return {
            "success": True,
            "mode": "MANUAL",
            "message": "Manual session started — instructor controls assessment completion.",
            "session_reference": payload.get("session_reference"),
        }

    async def get_status(self, session_reference: str) -> dict[str, Any]:
        return {
            "success": True,
            "status": "Running",
            "message": "Manual assessment in progress — awaiting instructor input.",
            "session_reference": session_reference,
        }

    async def fetch_results(self, session_reference: str) -> dict[str, Any]:
        return {
            "success": False,
            "message": "Manual results must be entered by the instructor via the portal.",
            "session_reference": session_reference,
        }

    async def terminate_session(self, session_reference: str) -> dict[str, Any]:
        return {
            "success": True,
            "message": "Manual session cancelled.",
            "session_reference": session_reference,
        }

    async def validate_configuration(self) -> dict[str, Any]:
        return {"valid": True, "message": "Manual mode requires no external configuration."}
