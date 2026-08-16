from typing import Dict, Any
from app.schemas.decision import StructuredDecision
from app.services.llm_client import LLMClient

EXTRACTION_SYSTEM_PROMPT = """You are Phronesis Extraction Engine.
Your job is to parse a user's natural language decision dilemma into a STRICT Structured Decision Model in JSON format.

JSON Schema Required:
{
  "decision_statement": "string summarizing the core choice",
  "alternatives": [
    {"id": "alt_1", "name": "Short Name", "description": "Details"}
  ],
  "states_of_world": [
    {"id": "state_1", "name": "Short State Name", "prior_probability": 0.50}
  ],
  "payoff_matrix": [
    {"alternative_id": "alt_1", "state_id": "state_1", "utility": 75.0, "narrative": "outcome description"}
  ],
  "goals": ["string"],
  "constraints": ["string"],
  "assumptions": [
    {"id": "assump_1", "text": "string", "type": "empirical|value_attribution|causal", "testable": true}
  ],
  "unknowns": ["string"]
}

Rules:
1. Payoff utilities must be numbers between 0 and 100.
2. Prior probabilities across states of the world must sum to 1.0.
3. Extract at least 2 distinct alternatives and at least 2 states of the world.
4. If probabilities are unstated, assign reasonable priors (e.g. 0.30 success, 0.70 failure for early ventures).
5. Extract explicit assumptions and mark whether they are testable empirical claims or subjective value judgments.
6. NEVER make a recommendation on what to choose. Return ONLY JSON.
"""

class ExtractionService:
    @classmethod
    async def extract_structured_decision(cls, narrative: str) -> StructuredDecision:
        user_prompt = f"Extract structured decision model from this dilemma:\n\n{narrative.strip()}"
        data = await LLMClient.generate_structured_json(
            system_prompt=EXTRACTION_SYSTEM_PROMPT,
            user_prompt=user_prompt
        )
        
        # Pydantic v2 validation and auto-normalization
        decision = StructuredDecision(**data)
        return decision
