import json
import os
from typing import List, Optional
from app.schemas.decision import (
    StructuredDecision,
    CriticalThinkingLayerResult,
    FalsifiabilityAuditItem,
    BaseRateComparisonItem
)

class CriticalThinkingEngine:
    """
    Critical Thinking Engine (V2):
    - Falsifiability audit of stated assumptions (High/Medium/Low grades + verifiable test methods)
    - Base-rate reality check across 12 empirical reference classes
    - Steelmanned counterargument synthesis
    """

    @classmethod
    def get_base_rates(cls) -> List[dict]:
        kb_path = os.path.join(os.path.dirname(__file__), "..", "knowledge", "base_rates.json")
        with open(kb_path, "r", encoding="utf-8") as f:
            return json.load(f)

    @classmethod
    def evaluate(cls, decision: StructuredDecision, steelmanned_text: Optional[str] = None) -> CriticalThinkingLayerResult:
        base_rates = cls.get_base_rates()

        # 1. Falsifiability Audit
        audit_items: List[FalsifiabilityAuditItem] = []
        for assump in decision.assumptions:
            text_lower = assump.text.lower()
            if assump.testable or any(w in text_lower for w in ["job", "market", "re-employment", "hiring", "compensation", "runway", "salary", "budget", "contractor", "timeline"]):
                grade = "High"
                test_method = "Can be verified within 7-14 days via 2-3 targeted market tests, discreet recruiter inquiries, or quote audits."
            elif any(w in text_lower for w in ["stagnat", "skills", "learn", "growth", "culture", "habit", "burnout"]):
                grade = "Medium"
                test_method = "Testable by initiating a focused 2-week internal milestone, prototype sprint, or structured time audit."
            else:
                grade = "Low"
                test_method = "Subjective value attribution; requires personal emotional calibration rather than empirical dataset."

            audit_items.append(
                FalsifiabilityAuditItem(
                    assumption=assump.text,
                    falsifiability_grade=grade,
                    test_method=test_method
                )
            )

        if not audit_items:
            audit_items.append(
                FalsifiabilityAuditItem(
                    assumption="Key forward assumptions can be verified prior to full resource commitment.",
                    falsifiability_grade="High",
                    test_method="Execute a time-boxed 48-hour informational test on the most sensitive variable."
                )
            )

        # 2. Base-Rate Check against 12 Reference Classes
        all_text = (
            decision.decision_statement + " " +
            " ".join(a.description for a in decision.alternatives) + " " +
            " ".join(s.name for s in decision.states_of_world) + " " +
            " ".join(decision.goals) + " " +
            " ".join(decision.constraints) + " " +
            " ".join(assump.text for assump in decision.assumptions) + " " +
            (decision.domain or "")
        ).lower()

        # Match highest keyword overlap
        best_match = None
        best_overlap_count = 0

        for br in base_rates:
            kw_matches = sum(1 for k in br.get("keywords", []) if k in all_text)
            if kw_matches > best_overlap_count:
                best_overlap_count = kw_matches
                best_match = br

        if not best_match and base_rates:
            best_match = base_rates[0]

        base_rate_item = None
        if best_match:
            # Estimate user's assumed probability for the primary upside state
            user_p = 0.35
            for s in decision.states_of_world:
                s_name = s.name.lower()
                if any(w in s_name for w in ["win", "succeed", "series a", "finish on time", "growth", "high scale", "beat", "success", "work out"]):
                    user_p = s.prior_probability
                    break

            emp_rate = best_match["empirical_base_rate_percentage"]
            user_pct = round(user_p * 100, 1)
            delta = round(user_pct - emp_rate, 1)

            if delta > 15.0:
                divergence_desc = f"Your estimated success probability ({user_pct}%) is significantly more optimistic than the empirical base rate of {emp_rate}% (+{delta}% divergence)."
            elif delta < -15.0:
                divergence_desc = f"Your estimated probability ({user_pct}%) is significantly more conservative than the empirical base rate of {emp_rate}% ({delta}% divergence)."
            else:
                divergence_desc = f"Your estimated probability ({user_pct}%) is closely aligned with the reference class base rate of {emp_rate}%."

            base_rate_item = BaseRateComparisonItem(
                reference_class=best_match["reference_class"],
                domain=best_match["domain"],
                source=best_match["source"],
                empirical_base_rate=emp_rate,
                user_assumption=f"{user_pct}% estimated upside probability",
                divergence_flag=divergence_desc
            )

        # 3. Steelmanning counterargument (fallback if none generated by LLM)
        if not steelmanned_text:
            steelmanned_text = (
                "The optimal decision may not be a binary forced choice between the two primary extremes. "
                "Evaluate whether a third synthetic option exists: de-risking the critical uncertainty via an incremental trial, "
                "parallel exploration, or renegotiating the terms before executing a permanent commitment."
            )

        return CriticalThinkingLayerResult(
            falsifiability_audit=audit_items,
            base_rate_check=base_rate_item,
            steelmanned_counterargument=steelmanned_text
        )
