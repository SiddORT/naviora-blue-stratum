"""Desktop offline connector — communicates with future Desktop Agent."""
from typing import Any

from app.connectors.base import BaseSimulatorConnector


class DesktopSimulatorConnector(BaseSimulatorConnector):
    """Connector for desktop-agent-mediated simulator execution.

    The Desktop Agent is not yet implemented. This connector generates
    launch request records and provides extension points for future use.

    Future flow:  Naviora → Desktop Agent → Simulator EXE
    """

    async def launch_session(self, payload: dict[str, Any]) -> dict[str, Any]:
        self._log("info", "launch_session (desktop mode — generating launch request)")
        return {
            "success": True,
            "mode": "DESKTOP_OFFLINE",
            "message": "Launch request queued for Desktop Agent.",
            "session_reference": payload.get("session_reference"),
            "launch_record": {
                "executable_path": self.config.get("executable_path"),
                "working_directory": self.config.get("working_directory"),
                "launch_arguments": self.config.get("launch_arguments"),
                "result_directory": self.config.get("result_directory"),
                "payload": payload,
            },
        }

    async def get_status(self, session_reference: str) -> dict[str, Any]:
        return {
            "success": True,
            "status": "Pending",
            "message": "Status polling not yet available without Desktop Agent.",
            "session_reference": session_reference,
        }

    async def fetch_results(self, session_reference: str) -> dict[str, Any]:
        result_dir = self.config.get("result_directory")
        return {
            "success": False,
            "message": "Desktop Agent result sync not yet implemented.",
            "result_directory": result_dir,
            "session_reference": session_reference,
        }

    async def terminate_session(self, session_reference: str) -> dict[str, Any]:
        return {
            "success": True,
            "message": "Termination request recorded — Desktop Agent will handle execution.",
            "session_reference": session_reference,
        }

    async def validate_configuration(self) -> dict[str, Any]:
        issues = []
        if not self.config.get("executable_path"):
            issues.append("executable_path is required for DESKTOP_OFFLINE mode")
        if not self.config.get("result_directory"):
            issues.append("result_directory is required for DESKTOP_OFFLINE mode")
        return {"valid": len(issues) == 0, "issues": issues}
