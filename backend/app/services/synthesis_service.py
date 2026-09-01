from typing import Dict, Any, List, Optional
from app.schemas.decision import AnalysisBundle, ReportResponse, SourceAttribution, LLMConfigOverride
from app.services.llm_client import LLMClient
from app.core.guardrails import ReportGuardrail

SYNTHESIS_SYSTEM_PROMPT = """You are Phronesis Multi-Disciplinary Report Synthesis Engine (V3).
Your job is to convert structured analytical findings from deterministic engines across 6 layers into a crisp, empathetic, structured markdown report:
1. Layer 1: Cognitive Psychology (25 Biases & Structural Grounding)
2. Layer 2: Decision Theory & Sensitivity Math (Expected Utility, Minimax Regret, Inflection Thresholds)
3. Layer 3: 8-Lens Philosophy (Stoicism, Utilitarianism, Deontology, Virtue Ethics, Existentialism, Care Ethics, Pragmatism, Eastern Flow)
4. Layer 4: Critical Thinking & Epistemic Antifragility (Base Rates, Bayesian Anchor, Falsifiability)
5. Layer 5: Economics & Valuation (EVPI/EVSI, Prospect Theory, Intertemporal Discounting, Real Options)
6. Layer 6: Systems Thinking & Game Theory (Feedback Loops, Strategic Signaling, Rawlsian Fairness Audit)

CRITICAL NON-NEGOTIABLE CONSTRAINTS:
1. Every single sentence MUST trace directly to a supplied data field or value.
2. NEVER prescribe a decision or give life advice ("You should choose X" is FORBIDDEN).
3. Always cite the scientific/philosophical field and literature source for every flagged bias, philosophical lens, economic solver, and systems concept.
4. Frame the conclusion around the Value of Information (VoI) and EVPI: what is the ceiling on rational information acquisition and what cheap real-world experiment tests the most sensitive variable before committing?
5. Use observational pattern language ("consistent with X"), never personal diagnostic labels.
6. Present all philosophical, economic, and systems lenses as parallel evaluative dimensions without declaring any framework correct.

Required Markdown Structure:
# Decision Reasoning Audit: [Title]

## Executive Summary of Reasoning Dynamics
[1 concise paragraph summarizing EU vs Minimax Regret tension, EVPI information value, and primary multi-disciplinary tradeoffs]

---

## 1. Mathematical Sensitivity & Inflection Thresholds
- [Bulleted points with exact computed numbers, inflection thresholds p*, EVPI/EVSI values, and utility deltas]

---

## 2. Quantitative Economics & Valuation
- **Expected Value of Perfect Information (EVPI):** [EVPI utility ceiling and fractional bound narrative]
- **Prospect Theory & Risk Preference:** [CPT vs EU framing comparison, loss-aversion penalty]
- **Intertemporal Choice & Discounting:** [Present-bias penalty under hyperbolic discounting vs exponential baseline]
- **Real Options & Convexity:** [Reversibility classification (Type 1 vs Type 2), hurdle rate premium, and Barbell Strategy applicability]

---

## 3. Sourced Cognitive & Systems Tradeoffs
### Cognitive Pattern Grounding
- [Flagged biases with literature citations (Field / Author / Theory) and grounding badges: [Explicit Variable] or [Narrative Nuance]]

### Systems Dynamics & Game Theoretic Strategic Context
- [Meadows Feedback Loops (R and B loops), Time Delays, Strategic Signaling credibility (Spence), and Rawlsian Veil of Ignorance fairness audit]

---

## 4. Multi-Lens Philosophical Reflection
- [Synthesized reflection across active philosophical lenses (Stoicism, Utilitarianism, Kantian, Virtue Ethics, Existentialism, Care Ethics, Pragmatism, Eastern Wisdom)]

---

## 5. High-Leverage Value of Information (VoI) Experiments
- **Most Critical Variable:** [Identify the sensitive parameter]
- **EVPI Information Ceiling:** [Maximum rational budget for information acquisition]
- **Proposed Low-Cost Experiments:** [1-2 concrete, low-cost/time-boxed experiments grounded in Pragmatist living-hypothesis framing]
"""

class SynthesisService:
    @classmethod
    async def synthesize_report(
        cls,
        bundle: AnalysisBundle,
        llm_config: Optional[LLMConfigOverride] = None
    ) -> ReportResponse:
        d = bundle.structured_decision
        m = bundle.math_layer
        b = bundle.bias_layer
        p_legacy = bundle.philosophy_layer
        p_multi = bundle.philosophy_multi_layer
        ct = bundle.critical_thinking_layer
        econ = getattr(bundle, "economics_layer", None)
        systems = getattr(bundle, "systems_layer", None)
        longitudinal = bundle.longitudinal_context
        effort = (getattr(bundle, "effort_level", None) or "standard").lower()
        project_context = getattr(bundle, "project_context", None)
        project_id = getattr(bundle, "project_id", None)

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

        # Economic attributions
        if econ:
            attributions.append(
                SourceAttribution(
                    field="decision_theory",
                    source="Raiffa & Schlaifer (1961); Howard (1966)",
                    referenced_item="Expected Value of Perfect Information (EVPI)"
                )
            )
            attributions.append(
                SourceAttribution(
                    field="behavioral_economics",
                    source="Tversky & Kahneman (1992); Arrow (1965)",
                    referenced_item="Cumulative Prospect Theory (CPT) & CRRA"
                )
            )
            attributions.append(
                SourceAttribution(
                    field="behavioral_economics",
                    source="Laibson (1997); Samuelson (1937)",
                    referenced_item="Quasi-Hyperbolic Discounting"
                )
            )
            attributions.append(
                SourceAttribution(
                    field="real_options",
                    source="Dixit & Pindyck (1994); Taleb (2012)",
                    referenced_item="Option Value of Waiting & Convexity"
                )
            )

        # Systems attributions
        if systems:
            attributions.append(
                SourceAttribution(
                    field="systems_thinking",
                    source="Meadows (2008), Thinking in Systems",
                    referenced_item="Feedback Loops & Structural Delays"
                )
            )
            attributions.append(
                SourceAttribution(
                    field="game_theory",
                    source="Spence (1973); Schelling (1960)",
                    referenced_item="Strategic Signaling & Commitment Devices"
                )
            )
            attributions.append(
                SourceAttribution(
                    field="political_philosophy",
                    source="Rawls (1971), A Theory of Justice",
                    referenced_item="Veil of Ignorance & Difference Principle"
                )
            )

        focus = getattr(bundle, "focus_config", None)
        focused_layers = focus.focused_layers if focus and focus.focused_layers else ["psychology", "logic", "philosophy", "economics", "systems", "practical"]
        foreground_fws = focus.philosophy_frameworks if focus and focus.philosophy_frameworks else []

        # Decided Depth Resolution: Effort (Coarse) x Focus Mode (Fine)
        def resolve_depth(layer_name: str) -> str:
            is_focused = layer_name in focused_layers
            if effort == "thorough":
                return "EXTENDED (comprehensive multi-paragraph deep-dive and nuance analysis)" if is_focused else "FULL (complete exposition with all context)"
            elif effort == "quick":
                return "FULL (focused key points with academic grounding)" if is_focused else "CONDENSED (crisp 1-2 sentence core summary)"
            else:  # standard
                return "FULL (thorough paragraph exposition with academic citations)" if is_focused else "CONDENSED (crisp 1-2 sentence summary)"

        math_depth = resolve_depth("practical")
        bias_depth = resolve_depth("psychology")
        phil_depth = resolve_depth("philosophy")
        logic_depth = resolve_depth("logic")
        econ_depth = resolve_depth("economics")
        sys_depth = resolve_depth("systems")

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
            "economics_layer": econ.model_dump() if econ else None,
            "systems_layer": systems.model_dump() if systems else None,
            "longitudinal_context": longitudinal.model_dump() if longitudinal else None,
            "project_context": project_context,
            "depth_directives": {
                "math_layer_depth": math_depth,
                "bias_layer_depth": bias_depth,
                "philosophy_layer_depth": phil_depth,
                "philosophy_foreground_frameworks": foreground_fws if effort != "thorough" else ["all_8_lenses_extended"],
                "critical_thinking_layer_depth": logic_depth,
                "economics_layer_depth": econ_depth,
                "systems_layer_depth": sys_depth,
                "effort_level": effort
            }
        }

        user_prompt = f"Synthesize this analytical bundle into the required report format respecting the depth directives for each layer:\n\n{context_payload}"
        raw_report = await LLMClient.generate_text(
            system_prompt=SYNTHESIS_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            llm_config=llm_config
        )

        # Two-Stage Synthesis Guardrail Pipeline (MANDATORY INVARIANCE ACROSS ALL EFFORT TIERS)
        # Stage 1: Fast Regex / Lexicon Linter
        is_regex_valid, regex_violations = ReportGuardrail.validate_text(raw_report)
        if not is_regex_valid:
            print(f"[Guardrail Triggered - Stage 1 Regex] Found violations: {regex_violations}. Falling back to structured template.")
            final_report = ReportGuardrail.generate_fallback_template(bundle)
        else:
            # Stage 2: Constrained LLM Boundary Audit
            audit_passed, offending_sentence, violation_reason = await ReportGuardrail.audit_boundaries_llm(
                raw_report,
                llm_config=llm_config
            )
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
            longitudinal_summary=longitudinal_summary_str,
            focus_config=focus,
            effort_level=effort,
            project_id=project_id
        )
