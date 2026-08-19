import re
from typing import Tuple, List, Optional, Dict, Any

FORBIDDEN_PRESCRIPTIVE_PATTERNS = [
    # Direct prescriptive directives & advice
    r"\byou\s+should\s+(choose|pick|select|decide|pursue|opt|take|go\s+with)\b",
    r"\byou\s+must\s+(choose|pick|select|decide|pursue|opt|take|go\s+with)\b",
    r"\bought\s+to\s+(choose|pick|select|decide|pursue|opt|take|go\s+with)?\b",
    r"\bought\s+to\b",
    r"\b(it\s+would\s+be\s+|is\s+)?prudent\s+to\s+(choose|pick|select|pursue|opt|take|go\s+with)?\b",
    r"\b(it\s+would\s+be\s+|is\s+)?prudent\s+to\b",
    r"\b(the\s+)?wiser\s+(path|choice|decision|option|course|way|alternative)\b",
    r"\bwiser\s+to\s+(choose|pick|select|pursue|opt|take|go\s+with)?\b",
    r"\bwiser\s+to\b",
    r"\bwe\s+recommend\s+that\s+you\b",
    r"\bi\s+recommend\s+(that\s+)?you\b",
    r"\b(i|we)\s+(strongly\s+)?(advise|recommend)\b",
    r"\badvise(s)?\s+(you|that\s+you|to)\b",
    r"\brecommend(s|ed)?\s+(that\s+)?(you|pursuing|choosing|selecting|taking)\b",
    r"\b(my|our)\s+recommendation\s+is\b",
    r"\bthe\s+only\s+logical\s+(choice|decision|option|path)\b",

    # Declaring winners / objective superiority
    r"\bthe\s+(correct|optimal|best|better|superior|recommended|wiser)\s+(choice|decision|option|path|course|alternative)\s+is\b",
    r"\bclearly\s+(the\s+best|the\s+superior|comes\s+out\s+ahead|wins|dominates)\b",
    r"\b(is|comes\s+out)\s+(as\s+)?clearly\s+superior\b",

    # Diagnostic & personality labeling
    r"\byou\s+have\s+(the\s+|a\s+)?[a-z\-]+\s+(bias|fallacy|tendency)\b",
    r"\byou\s+(are\s+suffering|suffer)\s+from\b",
    r"\byou\s+(are\s+exhibiting|exhibit)\s+(the|a)\b",
    r"\btextbook\s+(case|example|pattern)\s+of\b",
    r"\bclassic\s+([a-z\-]+\s+)*(case|example|pattern)\b",
    r"\b(a\s+)?classic\s+[a-z\-]+\s+pattern\b",
    r"\bexhibiting\s+a\s+classic\b",

    # Arbitrary scalar scoring / composite index
    r"\bscore:?\s+\d+/\d+\b",
    r"\brating:?\s+\d+/\d+\b",
    r"\bcomposite\s+score:?\s+\d+\b"
]

COMPILED_FORBIDDEN_PATTERNS = [re.compile(p, re.IGNORECASE) for p in FORBIDDEN_PRESCRIPTIVE_PATTERNS]

BOUNDARY_RUBRIC_TEXT = """THE 5 NON-NEGOTIABLE BOUNDARIES:
1. Never State a Diagnosis: Must use observational pattern language ("consistent with X"), NEVER personal diagnostic/identity labels ("you suffer from X", "you have X bias", "you are exhibiting classic X", "textbook case of").
2. Never Claim Mathematical Prescriptiveness: Decision theory tools (Expected Utility, Minimax Regret) are heuristics for stress-testing preferences, NEVER proofs of what life choices one ought to make. Must NEVER advise, prescribe, or declare a winner ("you should choose", "prudent to pick", "the wiser path", "Option A clearly comes out ahead").
3. Never Collapse to a Single Score: No scalar ratings, composite indices, or scores (e.g. "87/100", "Grade A").
4. Never Privilege a Single Philosophical School: Frameworks are lenses revealing distinct moral vectors, NEVER objective arbiters of right action.
5. Never Assert Psychological Certainty: Cognitive biases are flagged as possible risks to inspect, NEVER certain mental states.
"""

class ReportGuardrail:
    """
    Two-Stage Post-Generation Synthesis Guardrail Pipeline:
    Stage 1: Fast deterministic regex / lexicon linter.
    Stage 2: Constrained LLM boundary audit classifying text against the 5 Non-Negotiable Boundaries.
    Fail-safe: On failure of either stage, falls back to raw structured template rendering.
    """

    @classmethod
    def validate_text(cls, text: str) -> Tuple[bool, List[str]]:
        """
        Stage 1: Fast regex-based filter catching known prescriptive phrases,
        diagnostic labels, near-misses, and composite scoring.
        """
        violations = []
        for regex in COMPILED_FORBIDDEN_PATTERNS:
            matches = regex.findall(text)
            if matches:
                violations.append(f"Forbidden pattern detected: '{regex.pattern}' (matched: {matches})")
        return len(violations) == 0, violations

    @classmethod
    def find_offending_sentences(cls, text: str) -> List[str]:
        """
        Extracts specific sentences that trip the Stage 1 regex filter.
        """
        sentences = re.split(r'(?<=[.!?\n])\s+', text)
        offenders = []
        for sentence in sentences:
            s_clean = sentence.strip()
            if not s_clean:
                continue
            for regex in COMPILED_FORBIDDEN_PATTERNS:
                if regex.search(s_clean):
                    offenders.append(s_clean)
                    break
        return offenders

    @classmethod
    async def audit_boundaries_llm(cls, text: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Stage 2: Constrained LLM Audit Pass evaluating generated text strictly
        against the 5 Non-Negotiable Boundaries.
        Returns: (passed: bool, offending_sentence: Optional[str], violation_reason: Optional[str])
        """
        from app.services.llm_client import LLMClient
        result = await LLMClient.audit_report_boundaries(text)
        passed = bool(result.get("passed", True))
        offending_sentence = result.get("offending_sentence") or None
        violation_reason = result.get("violation_reason") or None
        return passed, offending_sentence, violation_reason

    @classmethod
    def generate_fallback_template(cls, bundle: Any) -> str:
        """
        Deterministic, pure template rendering of the analytical bundle directly.
        Guarantees zero ungrounded claims, zero prescriptive advice, and zero diagnostic labeling.
        Supports multi-framework philosophical lenses, structural grounding tiers, and longitudinal context.
        """
        d = bundle.structured_decision
        m = bundle.math_layer
        b = bundle.bias_layer
        p_legacy = bundle.philosophy_layer
        p_multi = getattr(bundle, "philosophy_multi_layer", None)
        longitudinal = getattr(bundle, "longitudinal_context", None)
        focus = getattr(bundle, "focus_config", None)
        focused_layers = focus.focused_layers if focus and focus.focused_layers else ["psychology", "logic", "philosophy", "practical"]

        best_eu_alt = m.expected_utility.preferred_alternative_id
        minimax_alt = m.minimax_regret.minimax_regret_choice

        alt_names = {a.id: a.name for a in d.alternatives}
        best_eu_name = alt_names.get(best_eu_alt, best_eu_alt)
        minimax_name = alt_names.get(minimax_alt, minimax_alt)

        inflection_pct = int(round(m.sensitivity_analysis.inflection_threshold * 100))
        critical_param = m.sensitivity_analysis.critical_parameter

        # Math Layer Formatting (Full vs Condensed)
        if "practical" in focused_layers:
            eu_bullets = []
            for aid, u_val in m.expected_utility.utilities.items():
                aname = alt_names.get(aid, aid)
                eu_bullets.append(f"- **{aname}:** {u_val:.1f} Expected Utility")
            eu_formatted = "\n".join(eu_bullets)
            math_section = f"{eu_formatted}\n- **Inflection Threshold:** The leading alternative flips when {critical_param} reaches {inflection_pct}%.\n- **Directional Sensitivity:** {m.sensitivity_analysis.directional_shift}"
        else:
            math_section = f"- **Summary:** '{best_eu_name}' achieves highest expected utility ({m.expected_utility.utilities.get(best_eu_alt, 0):.1f} EU); '{minimax_name}' minimizes maximum regret. Sensitivity threshold flips at {inflection_pct}% on '{critical_param}'."

        # Bias Layer Formatting (Full vs Condensed)
        if "psychology" in focused_layers:
            bias_bullets = []
            for pat in b.flagged_patterns:
                tier_badge = "[Explicit Variable]" if getattr(pat, "grounding_tier", "explicit_variable") == "explicit_variable" else "[Narrative Nuance]"
                bias_bullets.append(
                    f"- **{pat.name}** `{tier_badge}` (*Source: {pat.field} — {pat.source}*): "
                    f"Stated reasoning exhibits characteristics consistent with {pat.name.lower()}. "
                    f"Question to inspect: *{pat.question_to_surface}*"
                )
            biases_formatted = "\n".join(bias_bullets) if bias_bullets else "- No cognitive risk patterns flagged above threshold."
        else:
            if b.flagged_patterns:
                bias_names = ", ".join(p.name for p in b.flagged_patterns)
                biases_formatted = f"- **Summary:** {len(b.flagged_patterns)} cognitive pattern(s) identified ({bias_names}). Stated framing exhibits characteristics consistent with {b.flagged_patterns[0].name}."
            else:
                biases_formatted = "- No acute cognitive bias patterns flagged."

        # Multi-Framework Philosophy formatting (Full vs Condensed)
        if "philosophy" in focused_layers:
            philosophy_sections = []
            if p_multi and p_multi.frameworks:
                for fw in p_multi.frameworks:
                    q_text = fw.surfaced_questions[0] if fw.surfaced_questions else fw.core_idea
                    name_display = fw.framework_name
                    if "stoic" in fw.framework_id.lower() and "Stoic Lens" not in name_display:
                        name_display = f"Stoic Lens ({fw.framework_name})"
                    philosophy_sections.append(
                        f"- **{name_display}** (*Source: {fw.field} — {fw.source}*):\n"
                        f"  Reflective Inquiry: *{q_text}*"
                    )
            else:
                stoic_tension = p_legacy.indifferents_analysis.get("virtue_and_agency_tension", "")
                if not stoic_tension and p_legacy.surfaced_questions:
                    stoic_tension = p_legacy.surfaced_questions[0]
                philosophy_sections.append(
                    f"- **Stoic Lens — Dichotomy of Control** (*Source: {p_legacy.field} — {p_legacy.source}*): {stoic_tension}"
                )
            philosophy_formatted = "\n".join(philosophy_sections)
        else:
            philosophy_formatted = "- **Summary:** Evaluated across parallel ethical frameworks (Stoic agency, Consequentialist stakeholders, Kantian duty, Virtue formation). Decision stresses balance between external security and reasoned autonomy."

        # Longitudinal context block if present
        longitudinal_block = ""
        if longitudinal and longitudinal.summary_text:
            longitudinal_block = f"\n---\n\n## 4. Longitudinal Decision Patterns (Local Memory)\n{longitudinal.summary_text}\n"

        return f"""# Decision Reasoning Audit: {d.decision_statement}

## Executive Summary of Reasoning Dynamics
Analysis of the structured decision model reveals a primary structural tension between Expected Utility maximization and Minimax Regret mitigation. Alternative '{best_eu_name}' achieves the highest calculated expected utility under prior probabilities, while alternative '{minimax_name}' minimizes worst-case psychological regret.

---

## 1. Mathematical Sensitivity & Inflection Thresholds
{math_section}

---

## 2. Sourced Cognitive & Philosophical Tradeoffs
### Cognitive Pattern Grounding
{biases_formatted}

### Multi-Lens Philosophical Reflection
{philosophy_formatted}

---

## 3. High-Leverage Value of Information (VoI) Experiments
- **Most Critical Variable:** {critical_param}
- **Proposed Low-Cost Verification:** Run a focused 48-hour informational test on '{critical_param}' before committing resources.
{longitudinal_block}"""

    @classmethod
    def sanitize_or_fallback(cls, text: str) -> str:
        """
        Backwards-compatible string sanitizer replacing common prescriptive patterns with observational framing.
        """
        sanitized = text
        sanitized = re.sub(r"\byou should choose\b", "one option to inspect is", sanitized, flags=re.IGNORECASE)
        sanitized = re.sub(r"\byou must choose\b", "your decision model highlights", sanitized, flags=re.IGNORECASE)
        sanitized = re.sub(r"\bought to\b", "might consider whether to", sanitized, flags=re.IGNORECASE)
        sanitized = re.sub(r"\bit would be prudent to\b", "one perspective to evaluate is", sanitized, flags=re.IGNORECASE)
        sanitized = re.sub(r"\bwiser to\b", "one balanced path is to", sanitized, flags=re.IGNORECASE)
        sanitized = re.sub(r"\byou have (the )?([a-z\-]+) (bias|fallacy)\b", r"your framing exhibits characteristics consistent with \2", sanitized, flags=re.IGNORECASE)
        sanitized = re.sub(r"\bwe recommend that you\b", "a low-cost next step to evaluate is", sanitized, flags=re.IGNORECASE)
        sanitized = re.sub(r"\bi recommend that you\b", "a low-cost next step to evaluate is", sanitized, flags=re.IGNORECASE)
        return sanitized
