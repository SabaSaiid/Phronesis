from typing import Dict, Any, List
from app.schemas.decision import AnalysisBundle, ReportResponse, SourceAttribution
from app.services.llm_client import LLMClient
from app.core.guardrails import ReportGuardrail

SYNTHESIS_SYSTEM_PROMPT = """You are Phronesis Report Synthesis Engine.
Your job is to convert structured analytical findings from 4 deterministic engines into a crisp, empathetic, structured markdown report.

CRITICAL NON-NEGOTIABLE CONSTRAINTS:
1. Every single sentence MUST trace directly to a supplied data field or value.
2. NEVER prescribe a decision or give life advice ("You should choose X" is FORBIDDEN).
3. Always cite the scientific/philosophical field and literature source for every flagged bias or philosophical framework.
4. Frame the conclusion around the Value of Information (VoI): what is the single most sensitive uncertain parameter and what cheap real-world experiment tests it before committing?
5. Use observational pattern language ("consistent with X"), never personal diagnostic labels.

Required Markdown Structure:
# Decision Reasoning Audit: [Title]

## Executive Summary of Reasoning Dynamics
[1 concise paragraph summarizing EU vs Minimax Regret tension and primary tradeoff]

---

## 1. Mathematical Sensitivity & Inflection Thresholds
- [Bulleted points with exact computed numbers, inflection thresholds p*, and utility deltas]

---

## 2. Sourced Cognitive & Philosophical Tradeoffs
- [Flagged biases with literature citations (Field / Author / Theory)]
- [Stoic Dichotomy of Control reflection and Indifferents analysis]

---

## 3. High-Leverage Value of Information (VoI) Experiments
- **Most Critical Variable:** [Identify the sensitive parameter]
- **Proposed Low-Cost Experiments:** [1-2 concrete, low-cost/time-boxed experiments]
"""

class SynthesisService:
    @classmethod
    async def synthesize_report(cls, bundle: AnalysisBundle) -> ReportResponse:
        d = bundle.structured_decision
        m = bundle.math_layer
        b = bundle.bias_layer
        p = bundle.philosophy_layer
        ct = bundle.critical_thinking_layer

        # Sourced attributions collection
        attributions: List[SourceAttribution] = []
        for pat in b.flagged_patterns:
            attributions.append(
                SourceAttribution(
                    field=pat.field,
                    source=pat.source,
                    referenced_item=pat.name
                )
            )
        attributions.append(
            SourceAttribution(
                field=p.field,
                source=p.source,
                referenced_item=p.framework_name
            )
        )

        context_payload = {
            "decision_statement": d.decision_statement,
            "alternatives": [a.model_dump() for a in d.alternatives],
            "states": [s.model_dump() for s in d.states_of_world],
            "expected_utility": m.expected_utility.model_dump(),
            "minimax_regret": m.minimax_regret.model_dump(),
            "sensitivity_analysis": m.sensitivity_analysis.model_dump(),
            "flagged_biases": [pat.model_dump() for pat in b.flagged_patterns],
            "stoic_lens": p.model_dump(),
            "critical_thinking": ct.model_dump()
        }

        user_prompt = f"Synthesize this analytical bundle into the required report format:\n\n{context_payload}"
        raw_report = await LLMClient.generate_text(
            system_prompt=SYNTHESIS_SYSTEM_PROMPT,
            user_prompt=user_prompt
        )

        # Run Guardrail Linter
        is_valid, violations = ReportGuardrail.validate_text(raw_report)
        if not is_valid:
            print(f"[Guardrail Triggered] Found violations: {violations}. Sanitizing...")
            final_report = ReportGuardrail.sanitize_or_fallback(raw_report)
        else:
            final_report = raw_report

        # Extract primary experiment
        sensitive_var = m.sensitivity_analysis.critical_parameter
        proposed_exp = (
            f"Run a 48-hour low-cost verification test on '{sensitive_var}' before committing capital or tenure."
        )

        math_summary = {
            "expected_utility": m.expected_utility.utilities,
            "preferred_eu_alt": m.expected_utility.preferred_alternative_id,
            "minimax_regret_choice": m.minimax_regret.minimax_regret_choice,
            "inflection_threshold": m.sensitivity_analysis.inflection_threshold
        }

        return ReportResponse(
            report_markdown=final_report,
            key_sensitive_variable=sensitive_var,
            proposed_experiment=proposed_exp,
            attributed_sources=attributions,
            math_summary=math_summary
        )
