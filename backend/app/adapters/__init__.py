"""Simulator adapter package — vendor-agnostic integration framework."""
from app.adapters.base_adapter import BaseSimulatorAdapter
from app.adapters.pase_adapter import PASEAdapter
from app.adapters.kongsberg_adapter import KongsbergAdapter
from app.adapters.transas_adapter import TransasAdapter
from app.adapters.custom_adapter import CustomAdapter

__all__ = [
    "BaseSimulatorAdapter",
    "PASEAdapter",
    "KongsbergAdapter",
    "TransasAdapter",
    "CustomAdapter",
]

ADAPTER_REGISTRY: dict[str, type[BaseSimulatorAdapter]] = {
    "PASE": PASEAdapter,
    "KONGSBERG": KongsbergAdapter,
    "TRANSAS": TransasAdapter,
    "CUSTOM": CustomAdapter,
}


def get_adapter(vendor_code: str) -> type[BaseSimulatorAdapter]:
    """Return the adapter class for a given vendor code. Falls back to CustomAdapter."""
    return ADAPTER_REGISTRY.get(vendor_code.upper(), CustomAdapter)
