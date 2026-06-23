"""Cloud API simulator connector — communicates with remote simulator APIs."""
import logging
from typing import Any

import httpx

from app.connectors.base import BaseSimulatorConnector

logger = logging.getLogger(__name__)


class CloudSimulatorConnector(BaseSimulatorConnector):
    """Connector for browser-based or cloud-hosted simulator APIs."""

    def __init__(self, config: dict[str, Any] | None = None) -> None:
        super().__init__(config)
        self.api_endpoint: str = self.config.get("api_endpoint", "")
        self.timeout: int = self.config.get("timeout", 30)

    async def launch_session(self, payload: dict[str, Any]) -> dict[str, Any]:
        self._log("info", "launch_session", endpoint=self.api_endpoint)
        if not self.api_endpoint:
            return {"success": False, "error": "api_endpoint not configured", "session_reference": None}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(f"{self.api_endpoint}/sessions", json=payload)
                resp.raise_for_status()
                data = resp.json()
                return {
                    "success": True,
                    "session_reference": data.get("session_id") or data.get("reference"),
                    "raw_response": data,
                }
        except httpx.HTTPError as exc:
            self._log("error", "launch_session_failed", error=str(exc))
            return {"success": False, "error": str(exc), "session_reference": None, "raw_response": {}}

    async def get_status(self, session_reference: str) -> dict[str, Any]:
        self._log("info", "get_status", ref=session_reference)
        if not self.api_endpoint:
            return {"success": False, "status": "Unknown", "error": "api_endpoint not configured"}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(f"{self.api_endpoint}/sessions/{session_reference}")
                resp.raise_for_status()
                data = resp.json()
                return {"success": True, "status": data.get("status", "Unknown"), "raw_response": data}
        except httpx.HTTPError as exc:
            return {"success": False, "status": "Unknown", "error": str(exc)}

    async def fetch_results(self, session_reference: str) -> dict[str, Any]:
        self._log("info", "fetch_results", ref=session_reference)
        if not self.api_endpoint:
            return {"success": False, "results": {}, "error": "api_endpoint not configured"}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(f"{self.api_endpoint}/sessions/{session_reference}/results")
                resp.raise_for_status()
                data = resp.json()
                return {"success": True, "results": data, "raw_response": data}
        except httpx.HTTPError as exc:
            return {"success": False, "results": {}, "error": str(exc)}

    async def terminate_session(self, session_reference: str) -> dict[str, Any]:
        self._log("info", "terminate_session", ref=session_reference)
        if not self.api_endpoint:
            return {"success": False, "error": "api_endpoint not configured"}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.delete(f"{self.api_endpoint}/sessions/{session_reference}")
                resp.raise_for_status()
                return {"success": True, "raw_response": resp.json()}
        except httpx.HTTPError as exc:
            return {"success": False, "error": str(exc)}

    async def validate_configuration(self) -> dict[str, Any]:
        if not self.api_endpoint:
            return {"valid": False, "error": "api_endpoint is required for CLOUD_API mode"}
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{self.api_endpoint}/health")
                return {"valid": resp.is_success, "status_code": resp.status_code}
        except httpx.HTTPError as exc:
            return {"valid": False, "error": str(exc)}
