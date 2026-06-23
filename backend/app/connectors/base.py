"""Abstract base connector for all simulator integrations."""
import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)


class BaseSimulatorConnector(ABC):
    """Abstract base that every simulator connector must implement."""

    def __init__(self, config: dict[str, Any] | None = None) -> None:
        self.config = config or {}

    @abstractmethod
    async def launch_session(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Initiate a simulator session. Returns launch result dict."""

    @abstractmethod
    async def get_status(self, session_reference: str) -> dict[str, Any]:
        """Poll the status of a running session."""

    @abstractmethod
    async def fetch_results(self, session_reference: str) -> dict[str, Any]:
        """Retrieve raw results from a completed session."""

    @abstractmethod
    async def terminate_session(self, session_reference: str) -> dict[str, Any]:
        """Force-stop a running session."""

    @abstractmethod
    async def validate_configuration(self) -> dict[str, Any]:
        """Verify connector configuration is valid before use."""

    def _log(self, level: str, msg: str, **kwargs: Any) -> None:
        extra = " | ".join(f"{k}={v}" for k, v in kwargs.items())
        getattr(logger, level)(f"[{self.__class__.__name__}] {msg} {extra}".strip())
