import json
from typing import Dict, Any, List, Optional
from app.schemas.decision import DrillDownRequest, DrillDownResponse
from app.services.llm_client import LLMClient
from app.core.guardrails import ReportGuardrail

DRILLDOWN_SYSTEM_PROMPT = """You are Phronesis Deep-Dive Analytical Inquiry Engine.
Your role is to expand on a SINGLE flagged reasoning element (a specific cognitive bias, philosophical framework inquiry, or testable assumption) for an auditable decision analysis.

CRITICAL NON-NEGOTIABLE CONSTRAINTS:
1. NEVER prescribe what choice the user ought to make ("You should", "The optimal path is", "I advise").
2. NEVER diagnose the user personally ("You suffer from", "Your bias is", "You are exhibiting"). Use observational pattern language ("Stated reasoning exhibits characteristics consistent with...").
3. Connect the item directly to peer-reviewed academic literature or classic philosophical sources.
4. Frame the conclusion around a concrete, time-boxed reframing exercise or empirical falsification test.
5. Return ONLY a valid JSON object matching the required schema.

Required JSON Schema:
{
  "deep_dive_markdown": "2-3 crisp markdown paragraphs unpacking the analytical mechanism, its specific manifestation in the stated decision, and why this trade-off matters.",
  "academic_context": "Field and foundational literature citation (Author, Year, Concept).",
  "probing_questions": [
    "Question 1 challenging the assumption or mental model",
    "Question 2 exploring counterfactual alternatives"
  ],
  "concrete_action_or_test": "A specific, low-cost (24-48hr) reframing exercise or empirical verification step."
}
"""

class DrillDownService:
    @classmethod
    async def generate_drill_down(cls, req: DrillDownRequest) -> DrillDownResponse:
        user_prompt = (
            f"Decision Statement: {req.decision_statement}\n"
            f"Item Type: {req.item_type}\n"
            f"Item ID: {req.item_id}\n"
            f"Item Title: {req.item_title}\n"
            f"Item Context:\n{json.dumps(req.item_context, indent=2)}"
        )

        try:
            raw_response = await LLMClient.generate_structured_json(
                system_prompt=DRILLDOWN_SYSTEM_PROMPT,
                user_prompt=user_prompt
            )
            
            deep_dive_md = raw_response.get("deep_dive_markdown", "")
            academic_ctx = raw_response.get("academic_context", "")
            probing_qs = raw_response.get("probing_questions", [])
            concrete_action = raw_response.get("concrete_action_or_test", "")

            # Validate against Stage 1 Guardrail (Regex)
            is_valid, _ = ReportGuardrail.validate_text(deep_dive_md)
            if not is_valid or not deep_dive_md:
                return cls._generate_deterministic_fallback(req)

            return DrillDownResponse(
                item_id=req.item_id,
                item_title=req.item_title,
                deep_dive_markdown=deep_dive_md,
                academic_context=academic_ctx or req.item_context.get("source"),
                probing_questions=probing_qs if probing_qs else [
                    f"How would your evaluation change if the assumptions underlying '{req.item_title}' were inverted?",
                    "What observable evidence in the next 7 days would confirm or disconfirm this dynamic?"
                ],
                concrete_action_or_test=concrete_action or "Conduct a 48-hour informational test with an external peer before committing."
            )
        except Exception as e:
            print(f"[DrillDownService Warning] LLM generation failed ({e}). Using deterministic fallback.")
            return cls._generate_deterministic_fallback(req)

    @classmethod
    def _generate_deterministic_fallback(cls, req: DrillDownRequest) -> DrillDownResponse:
        """
        Deterministic, publication-grade deep-dive template.
        """
        item_type = req.item_type.lower()
        title = req.item_title
        ctx = req.item_context

        if "bias" in item_type:
            source = ctx.get("source", "Behavioral Decision Research")
            field = ctx.get("field", "Cognitive Psychology")
            caveat = ctx.get("caveat_analysis", f"Patterns consistent with {title.lower()} frequently lead operators to over-weight salient historical commitments.")
            q_to_surface = ctx.get("question_to_surface", f"Would you make this exact choice today if you were starting with a clean slate?")

            markdown = (
                f"### Analytical Mechanism: {title}\n\n"
                f"In the literature of **{field}** (*{source}*), this pattern describes how human evaluators systemically overweight past investments, immediate availability, or default baselines.\n\n"
                f"**Manifestation in Decision:** {caveat}\n\n"
                f"**Reframing Lens:** To counteract this tendency without compromising conviction, decision theorists recommend isolating the marginal future expected value from accumulated historical tenure."
            )
            return DrillDownResponse(
                item_id=req.item_id,
                item_title=title,
                deep_dive_markdown=markdown,
                academic_context=f"{field} — {source}",
                probing_questions=[
                    q_to_surface,
                    "If a trusted successor replaced you in this decision tomorrow, what path would they choose without historical baggage?"
                ],
                concrete_action_or_test="The Clean-Slate Audit: Write down the decision assuming zero past time or capital has been invested."
            )

        elif "philosophy" in item_type or "stoic" in item_type or "virtue" in item_type:
            source = ctx.get("source", "Classical Ethics")
            field = ctx.get("field", "Philosophy")
            core_idea = ctx.get("core_idea", "Ethical frameworks reveal structural tensions across distinct moral axes.")

            markdown = (
                f"### Philosophical Tension: {title}\n\n"
                f"Grounded in **{field}** (*{source}*), this lens illuminates fundamental questions of moral agency, utility distribution, and character formation.\n\n"
                f"**Core Principle:** {core_idea}\n\n"
                f"**Reflective Balance:** Rather than dictating an absolute answer, this lens asks how the chosen path aligns with long-term human flourishing (eudaimonia) and reasoned agency."
            )
            return DrillDownResponse(
                item_id=req.item_id,
                item_title=title,
                deep_dive_markdown=markdown,
                academic_context=f"{field} — {source}",
                probing_questions=[
                    f"How does this choice cultivate your underlying virtues and long-term autonomy?",
                    "If your decision became a public case study, would the governing rule stand up to universal scrutiny?"
                ],
                concrete_action_or_test="Dichotomy of Control Journal: Explicitly separate the controllable actions from external uncontrollable outcomes over the next 30 days."
            )

        else: # Assumption / Logic / Falsifiability
            assumption_text = ctx.get("text", ctx.get("assumption", req.item_title))
            test_method = ctx.get("test_method", "Identify the critical observable metric and establish a 48-hour verification protocol.")

            markdown = (
                f"### Epistemic Stress-Test: {title}\n\n"
                f"Critical thinking and Popperian epistemology emphasize that robust decisions rest upon **falsifiable empirical claims** rather than untested value convictions.\n\n"
                f"**Target Assumption:** *\"{assumption_text}\"*\n\n"
                f"**Vulnerability Analysis:** When high-stakes decisions rely on unverified empirical claims, failure modes are magnified. Converting implicit belief into explicit testable thresholds prevents confirmation bias."
            )
            return DrillDownResponse(
                item_id=req.item_id,
                item_title=title,
                deep_dive_markdown=markdown,
                academic_context="Epistemology & Decision Engineering (Karl Popper / Taleb)",
                probing_questions=[
                    "What specific piece of real-world evidence would prove this assumption definitively false?",
                    "What is the cost of being wrong about this assumption over a 12-month horizon?"
                ],
                concrete_action_or_test=f"Low-Cost Verification Experiment: {test_method}"
            )
