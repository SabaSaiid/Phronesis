from typing import Optional
from app.schemas.decision import StructuredDecision, LLMConfigOverride
from app.services.llm_client import LLMClient

STEELMANNING_SYSTEM_PROMPT = """You are Phronesis Critical Thinking Assistant.
Your task is to generate the strongest, most intellectually rigorous steelmanned counterargument against the user's currently favored alternative.

Guidelines:
1. Do not insult the user or declare their choice objectively wrong.
2. Highlight a blindspot, unexamined tradeoff, or overlooked third alternative path.
3. Keep the response to 1-2 powerful, concise paragraphs.
4. Enforce strict caveat tone.
"""

class CounterargumentService:
    @classmethod
    async def generate_counterargument(
        cls,
        decision: StructuredDecision,
        leading_alt_id: str,
        llm_config: Optional[LLMConfigOverride] = None
    ) -> str:
        prompt = (
            f"Decision Statement: {decision.decision_statement}\n"
            f"Leading Alternative: {leading_alt_id}\n"
            f"Goals: {', '.join(decision.goals)}\n"
            f"Constraints: {', '.join(decision.constraints)}\n"
            f"Assumptions: {', '.join(a.text for a in decision.assumptions)}\n\n"
            "Provide the strongest steelmanned counter-thesis to stress-test this alternative."
        )
        counter_arg = await LLMClient.generate_text(
            system_prompt=STEELMANNING_SYSTEM_PROMPT,
            user_prompt=prompt,
            llm_config=llm_config
        )
        return counter_arg.strip()
