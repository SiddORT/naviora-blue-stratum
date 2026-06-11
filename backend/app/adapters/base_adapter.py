"""BaseSimulatorAdapter — abstract contract every adapter must satisfy."""
import logging
from abc import ABC, abstractmethod
from typing import Any, Optional

logger = logging.getLogger(__name__)


class AdapterConnectionError(Exception):
    """Raised when a simulator connection attempt fails."""


class AdapterSessionError(Exception):
    """Raised when a session operation fails."""


class BaseSimulatorAdapter(ABC):
    """
    Abstract base class for all simulator adapters.

    Every concrete adapter must implement all abstract methods.
    No simulator-specific logic lives outside its own adapter class.
    """

    def __init__(self, config: dict[str, Any]) -> None:
        """
        :param config: Flattened configuration dict from SimulatorConfiguration.
                       Keys: base_url, authentication_type, api_key,
                             client_id, client_secret, connection_timeout, etc.
        """
        self.config = config
        self.base_url: str = config.get("base_url", "")
        self.timeout: int = int(config.get("connection_timeout", 30))

    @abstractmethod
    async def test_connection(self) -> dict[str, Any]:
        """
        Verify connectivity to the simulator endpoint.

        Returns:
            {"success": bool, "message": str, "latency_ms": int | None}
        """

    @abstractmethod
    async def start_session(self, session_data: dict[str, Any]) -> dict[str, Any]:
        """
        Instruct the simulator to begin an exercise session.

        :param session_data: Exercise and candidate metadata.
        Returns:
            {"success": bool, "session_reference": str, "raw_response": dict}
        """

    @abstractmethod
    async def end_session(self, session_reference: str) -> dict[str, Any]:
        """
        Signal the simulator to end an active session.

        :param session_reference: Simulator-assigned session identifier.
        Returns:
            {"success": bool, "message": str, "raw_response": dict}
        """

    @abstractmethod
    async def get_results(self, session_reference: str) -> dict[str, Any]:
        """
        Retrieve exercise results from the simulator.

        :param session_reference: Simulator-assigned session identifier.
        Returns:
            {"success": bool, "results": dict, "raw_response": dict}
        """

    @abstractmethod
    async def transform_payload(self, raw_payload: dict[str, Any]) -> dict[str, Any]:
        """
        Normalise a vendor-specific payload into the Naviora internal schema.

        :param raw_payload: Raw data received from the simulator.
        Returns:
            Standardised Naviora payload dict.
        """

    def _log(self, level: str, message: str, **kwargs: Any) -> None:
        extra = " ".join(f"{k}={v}" for k, v in kwargs.items())
        getattr(logger, level)(f"[{self.__class__.__name__}] {message} {extra}".strip())
