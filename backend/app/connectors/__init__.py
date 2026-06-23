"""Simulator connector framework."""
from app.connectors.base import BaseSimulatorConnector
from app.connectors.cloud import CloudSimulatorConnector
from app.connectors.desktop import DesktopSimulatorConnector
from app.connectors.manual import ManualSimulatorConnector

__all__ = [
    "BaseSimulatorConnector",
    "CloudSimulatorConnector",
    "DesktopSimulatorConnector",
    "ManualSimulatorConnector",
]

CONNECTOR_MAP = {
    "CLOUD_API": CloudSimulatorConnector,
    "DESKTOP_OFFLINE": DesktopSimulatorConnector,
    "MANUAL": ManualSimulatorConnector,
}


def get_connector(runtime_mode: str) -> type[BaseSimulatorConnector]:
    return CONNECTOR_MAP.get(runtime_mode, ManualSimulatorConnector)
