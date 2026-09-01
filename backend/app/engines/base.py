"""
Base Engine and Registry Infrastructure for Phronesis.

Defines the abstract contract for all deterministic reasoning engines.
Ensures uniform interface, strict separation of pure computation from side effects,
and extensible multi-engine registration.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Type, List, Optional
from app.schemas.decision import StructuredDecision


class BaseDeterministicEngine(ABC):
    """
    Abstract base class for all deterministic analytical engines in Phronesis.
    
    Guarantees:
      - Stateless execution.
      - Zero LLM dependencies in pure engine logic.
      - Rigorous output schemas with full traceability.
    """
    engine_id: str
    engine_name: str
    layer_number: int

    @classmethod
    @abstractmethod
    def evaluate(cls, decision: StructuredDecision, **kwargs: Any) -> Any:
        """
        Executes pure analytical logic against a StructuredDecision.
        """
        raise NotImplementedError("Engines must implement evaluate()")


class EngineRegistry:
    """
    Central registry for all deterministic reasoning engines in Phronesis.
    """
    _registry: Dict[str, Type[BaseDeterministicEngine]] = {}

    @classmethod
    def register(cls, engine_cls: Type[BaseDeterministicEngine]) -> Type[BaseDeterministicEngine]:
        """Decorator or explicit registrar for engines."""
        if not hasattr(engine_cls, "engine_id") or not engine_cls.engine_id:
            raise ValueError(f"Engine class {engine_cls.__name__} must define a unique 'engine_id'.")
        cls._registry[engine_cls.engine_id] = engine_cls
        return engine_cls

    @classmethod
    def get(cls, engine_id: str) -> Optional[Type[BaseDeterministicEngine]]:
        return cls._registry.get(engine_id)

    @classmethod
    def list_engines(cls) -> List[Dict[str, Any]]:
        return [
            {
                "engine_id": eng.engine_id,
                "engine_name": getattr(eng, "engine_name", eng.__name__),
                "layer_number": getattr(eng, "layer_number", 0),
            }
            for eng in cls._registry.values()
        ]
