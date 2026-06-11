"""Custom / generic simulator adapter — fallback for unknown vendor codes."""
from typing import Any

from app.adapters.base_adapter import BaseSimulatorAdapter


class CustomAdapter(BaseSimulatorAdapter):
    """
    Generic adapter for custom or unrecognised simulators.
    Acts as the fallback when no specific vendor adapter is registered.
    """

    async def test_connection(self) -> dict[str, Any]:
        self._log("info", "test_connection called", base_url=self.base_url)
        return {
            "success": False,
            "message": "Custom adapter — configure test_connection for your simulator.",
            "latency_ms": None,
        }

    async def start_session(self, session_data: dict[str, Any]) -> dict[str, Any]:
        self._log("info", "start_session called")
        return {
            "success": False,
            "session_reference": "",
            "raw_response": {},
            "message": "Custom adapter — configure start_session for your simulator.",
        }

    async def end_session(self, session_reference: str) -> dict[str, Any]:
        self._log("info", "end_session called", ref=session_reference)
        return {
            "success": False,
            "message": "Custom adapter — configure end_session for your simulator.",
            "raw_response": {},
        }

    async def get_results(self, session_reference: str) -> dict[str, Any]:
        self._log("info", "get_results called", ref=session_reference)
        return {
            "success": False,
            "results": {},
            "raw_response": {},
            "message": "Custom adapter — configure get_results for your simulator.",
        }

    async def transform_payload(self, raw_payload: dict[str, Any]) -> dict[str, Any]:
        return raw_payload
