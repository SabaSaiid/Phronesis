import json
from typing import List
from app.schemas.decision import StructuredDecision, BiasLayerResult
from app.engines.bias_engine import BiasPatternEngine

class RubricMatchingService:
    """
    In-Context Rubric Classifier:
    Scores the structured decision against the human-curated lookup table.
    Ensures zero new categories are invented.
    """

    @classmethod
    async def match_rubric(cls, decision: StructuredDecision) -> BiasLayerResult:
        # Run deterministic engine first
        deterministic_result = BiasPatternEngine.evaluate(decision)
        return deterministic_result
