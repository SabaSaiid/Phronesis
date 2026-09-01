import json
import os
import functools
from typing import List, Optional
from app.schemas.decision import (
    StructuredDecision,
    CriticalThinkingLayerResult,
    FalsifiabilityAuditItem,
    BaseRateComparisonItem
)

from app.engines.base import BaseDeterministicEngine, EngineRegistry


@EngineRegistry.register
class CriticalThinkingEngine(BaseDeterministicEngine):
    """
    Critical Thinking & Epistemic Antifragility Engine (Layer 4):
    - Falsifiability audit of stated assumptions (High/Medium/Low grades + verifiable test methods)
    - Base-rate reality check across 16 empirical reference classes (Kahneman & Tversky 1973)
    - Bayesian update calibration narrative (Gelman et al. 2013)
    - Epistemic Antifragility assessment (Taleb 2012)
    - Steelmanned counterargument synthesis
    """
    engine_id = "critical_thinking_engine_v1"
    engine_name = "Critical Thinking & Epistemic Antifragility Engine"
    layer_number = 4

    @classmethod
    @functools.lru_cache(maxsize=1)
    def get_base_rates(cls) -> List[dict]:
        kb_path = os.path.join(os.path.dirname(__file__), "..", "knowledge", "base_rates.json")
        with open(kb_path, "r", encoding="utf-8") as f:
            return json.load(f)

    @classmethod
    def evaluate(cls, decision: StructuredDecision, steelmanned_text: Optional[str] = None, **kwargs) -> CriticalThinkingLayerResult:
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

        # 2. Base-Rate Check against 16 Reference Classes
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
        bayesian_narrative = None
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

            # Bayesian update calibration (Kahneman-Tversky anchor & adjust)
            # Weighted average between empirical base rate and user prior: P_calibrated ≈ 0.6 * BaseRate + 0.4 * UserPrior
            calibrated_pct = round(0.6 * emp_rate + 0.4 * user_pct, 1)
            bayesian_narrative = (
                f"Bayesian calibration anchor (Kahneman & Tversky 1973): Combining the empirical base rate "
                f"({emp_rate}%) with your case-specific estimate ({user_pct}%) yields a calibrated prior of "
                f"approximately {calibrated_pct}%. Testing the core assumption with a low-cost experiment "
                f"allows a formal Bayesian update before full commitment."
            )

        # 3. Antifragility / Optionality Score
        # Proportion of assumptions that are testable + proportion of alternatives that retain optionality
        high_grade_count = sum(1 for item in audit_items if item.falsifiability_grade == "High")
        antifragility_score = round(min(1.0, (high_grade_count / max(1, len(audit_items))) * 0.7 + 0.3), 2)

        # 4. Steelmanning counterargument (fallback if none generated by LLM)
        if not steelmanned_text:
            steelmanned_text = (
                "The optimal decision may not be a binary forced choice between the two primary extremes. "
                "Evaluate whether a third synthetic option exists: de-risking the critical uncertainty via an incremental trial, "
                "parallel exploration, or renegotiating the terms before executing a permanent commitment."
            )

        return CriticalThinkingLayerResult(
            falsifiability_audit=audit_items,
            base_rate_check=base_rate_item,
            steelmanned_counterargument=steelmanned_text,
            antifragility_score=antifragility_score,
            bayesian_update_narrative=bayesian_narrative
        )
