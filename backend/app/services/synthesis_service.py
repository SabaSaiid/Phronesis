from typing import Dict, Any, List, Optional
from app.schemas.decision import AnalysisBundle, ReportResponse, SourceAttribution
from app.services.llm_client import LLMClient
from app.core.guardrails import ReportGuardrail

SYNTHESIS_SYSTEM_PROMPT = """You are Phronesis Report Synthesis Engine.
Your job is to convert structured analytical findings from deterministic engines into a crisp, empathetic, structured markdown report.

CRITICAL NON-NEGOTIABLE CONSTRAINTS:
1. Every single sentence MUST trace directly to a supplied data field or value.
2. NEVER prescribe a decision or give life advice ("You should choose X" is FORBIDDEN).
3. Always cite the scientific/philosophical field and literature source for every flagged bias or philosophical framework.
4. Frame the conclusion around the Value of Information (VoI): what is the single most sensitive uncertain parameter and what cheap real-world experiment tests it before committing?
5. Use observational pattern language ("consistent with X"), never personal diagnostic labels.
6. Present all four philosophical lenses (Stoicism, Utilitarianism, Kantian Deontology, Aristotelian Virtue Ethics) as parallel evaluative dimensions without declaring any framework correct.

Required Markdown Structure:
# Decision Reasoning Audit: [Title]

## Executive Summary of Reasoning Dynamics
[1 concise paragraph summarizing EU vs Minimax Regret tension and primary tradeoff]

---

## 1. Mathematical Sensitivity & Inflection Thresholds
- [Bulleted points with exact computed numbers, inflection thresholds p*, and utility deltas]

---

## 2. Sourced Cognitive & Philosophical Tradeoffs
### Cognitive Pattern Grounding
- [Flagged biases with literature citations (Field / Author / Theory) and grounding badges: [Explicit Variable] or [Narrative Nuance]]

### Multi-Lens Philosophical Reflection
- [Stoic Dichotomy of Control reflection]
- [Utilitarian Consequentialist stakeholder consideration]
- [Kantian Deontological universalizability test]
- [Aristotelian Virtue Ethics character & golden mean inquiry]

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
        p_legacy = bundle.philosophy_layer
        p_multi = bundle.philosophy_multi_layer
        ct = bundle.critical_thinking_layer
        longitudinal = bundle.longitudinal_context

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

        if p_multi and p_multi.frameworks:
            for fw in p_multi.frameworks:
                attributions.append(
                    SourceAttribution(
                        field=fw.field,
                        source=fw.source,
                        referenced_item=fw.framework_name
                    )
                )
        else:
            attributions.append(
                SourceAttribution(
                    field=p_legacy.field,
                    source=p_legacy.source,
                    referenced_item=p_legacy.framework_name
                )
            )

        if ct.base_rate_check:
            attributions.append(
                SourceAttribution(
                    field=ct.base_rate_check.domain,
                    source=ct.base_rate_check.source,
                    referenced_item=ct.base_rate_check.reference_class
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
            "philosophy_frameworks": [fw.model_dump() for fw in (p_multi.frameworks if p_multi else [])],
            "critical_thinking": ct.model_dump(),
            "longitudinal_context": longitudinal.model_dump() if longitudinal else None
        }

        user_prompt = f"Synthesize this analytical bundle into the required report format:\n\n{context_payload}"
        raw_report = await LLMClient.generate_text(
            system_prompt=SYNTHESIS_SYSTEM_PROMPT,
            user_prompt=user_prompt
        )

        # Two-Stage Synthesis Guardrail Pipeline
        # Stage 1: Fast Regex / Lexicon Linter
        is_regex_valid, regex_violations = ReportGuardrail.validate_text(raw_report)
        if not is_regex_valid:
            print(f"[Guardrail Triggered - Stage 1 Regex] Found violations: {regex_violations}. Falling back to structured template.")
            final_report = ReportGuardrail.generate_fallback_template(bundle)
        else:
            # Stage 2: Constrained LLM Boundary Audit
            audit_passed, offending_sentence, violation_reason = await ReportGuardrail.audit_boundaries_llm(raw_report)
            if not audit_passed:
                print(f"[Guardrail Triggered - Stage 2 LLM Audit] Boundary violation detected: {violation_reason}. Offending: '{offending_sentence}'. Falling back to structured template.")
                final_report = ReportGuardrail.generate_fallback_template(bundle)
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

        longitudinal_summary_str = longitudinal.summary_text if longitudinal else None

        return ReportResponse(
            report_markdown=final_report,
            key_sensitive_variable=sensitive_var,
            proposed_experiment=proposed_exp,
            attributed_sources=attributions,
            math_summary=math_summary,
            longitudinal_summary=longitudinal_summary_str
        )
