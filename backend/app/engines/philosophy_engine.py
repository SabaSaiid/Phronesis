import json
import os
import functools
from typing import List, Dict, Any
from app.schemas.decision import (
    StructuredDecision,
    PhilosophyLayerResult,
    PhilosophyFrameworkResult,
    StoicAnalysisResult
)

class PhilosophyEngine:
    """
    Multi-Framework Philosophy Engine (V2):
    Evaluates decisions across 4 parallel ethical and philosophical lenses:
    1. Stoic Decision Ethics (Dichotomy of Control & Indifferents)
    2. Utilitarian Consequentialism (Aggregate Well-being & Stakeholder Externalities)
    3. Kantian Deontology (Universalizability & Respect for Persons)
    4. Aristotelian Virtue Ethics (Character Cultivation & Golden Mean)

    Core Axiom: No framework is declared correct or privileged.
    """

    @classmethod
    @functools.lru_cache(maxsize=1)
    def get_frameworks(cls) -> List[dict]:
        kb_path = os.path.join(os.path.dirname(__file__), "..", "knowledge", "philosophy_frameworks.json")
        with open(kb_path, "r", encoding="utf-8") as f:
            return json.load(f)

    @classmethod
    def evaluate(cls, decision: StructuredDecision) -> PhilosophyLayerResult:
        raw_fws = cls.get_frameworks()
        results: List[PhilosophyFrameworkResult] = []

        all_text = (
            decision.decision_statement + " " +
            " ".join(a.description for a in decision.alternatives) + " " +
            " ".join(decision.goals) + " " +
            " ".join(decision.constraints) + " " +
            " ".join(assump.text for assump in decision.assumptions) + " " +
            " ".join(decision.unknowns)
        ).lower()

        # 1. Stoic Framework
        stoic_fw = next((f for f in raw_fws if f["id"] == "stoicism_v1"), raw_fws[0])
        internal_kw = stoic_fw["classification_rules"]["internal_control_keywords"]
        external_kw = stoic_fw["classification_rules"]["external_uncontrollable_keywords"]

        internal_items = []
        external_items = []
        for c in decision.constraints:
            if any(k in c.lower() for k in internal_kw):
                internal_items.append(f"Constraint: {c}")
            else:
                external_items.append(f"Constraint: {c}")
        for g in decision.goals:
            if any(k in g.lower() for k in internal_kw):
                internal_items.append(f"Goal: {g}")
            else:
                external_items.append(f"Goal: {g}")
        for a in decision.assumptions:
            if any(k in a.text.lower() for k in external_kw):
                external_items.append(f"Assumption: {a.text}")
            else:
                internal_items.append(f"Assumption: {a.text}")
        for u in decision.unknowns:
            external_items.append(f"Unknown: {u}")

        if not internal_items:
            internal_items = ["Management of personal savings and burn rate", "Quality of daily craft and execution", "Internal emotional composure"]
        if not external_items:
            external_items = ["Macro market and fundraising appetite", "Future industry hiring cycles in 18 months", "Competitor dynamics"]

        stoic_analysis = {
            "internal_controllables": internal_items[:4],
            "external_uncontrollables": external_items[:4],
            "virtue_and_agency_tension": (
                "Stoic ethics notes that compensation, title, and comfort are 'preferred indifferents' (proēgmena). "
                "The essential good is reasoned choice, self-efficacy, and moral agency. If staying in a comfortable "
                "role causes skill atrophy, you are sacrificing agency to preserve an indifferent."
            )
        }
        results.append(
            PhilosophyFrameworkResult(
                framework_id=stoic_fw["id"],
                framework_name=stoic_fw["framework_name"],
                field=stoic_fw["field"],
                source=stoic_fw["source"],
                core_idea=stoic_fw["core_idea"],
                dimension_analysis=stoic_analysis,
                surfaced_questions=[q["question"] for q in stoic_fw.get("lens_questions", [])]
            )
        )

        # Legacy Stoic result for backward compatibility
        legacy_stoic = StoicAnalysisResult(
            framework_id=stoic_fw["id"],
            framework_name=stoic_fw["framework_name"],
            field=stoic_fw["field"],
            source=stoic_fw["source"],
            dichotomy_of_control={
                "internal_controllables": internal_items[:4],
                "external_uncontrollables": external_items[:4]
            },
            indifferents_analysis={
                "preferred_indifferents": ["Compensation / Equity", "Prestige / Status", "Predictable Comfort"],
                "virtue_and_agency_tension": stoic_analysis["virtue_and_agency_tension"]
            },
            surfaced_questions=[q["question"] for q in stoic_fw.get("lens_questions", [])]
        )

        # 2. Utilitarian Framework
        util_fw = next((f for f in raw_fws if f["id"] == "utilitarianism_v1"), None)
        if util_fw:
            stakeholder_kw = util_fw["classification_rules"]["stakeholder_keywords"]
            detected_stakeholders = [k for k in stakeholder_kw if k in all_text]
            if not detected_stakeholders:
                detected_stakeholders = ["self", "immediate household", "future self"]

            util_analysis = {
                "detected_stakeholders": detected_stakeholders,
                "utility_balance_insight": (
                    f"Consequentialist evaluation highlights the multi-stakeholder perimeter ({', '.join(detected_stakeholders[:3])}). "
                    "A pure individual optimization may hide asymmetric emotional or financial externalities transferred to stakeholders."
                )
            }
            results.append(
                PhilosophyFrameworkResult(
                    framework_id=util_fw["id"],
                    framework_name=util_fw["framework_name"],
                    field=util_fw["field"],
                    source=util_fw["source"],
                    core_idea=util_fw["core_idea"],
                    dimension_analysis=util_analysis,
                    surfaced_questions=[q["question"] for q in util_fw.get("lens_questions", [])]
                )
            )

        # 3. Kantian Deontology Framework
        kant_fw = next((f for f in raw_fws if f["id"] == "kantian_deontology_v1"), None)
        if kant_fw:
            duty_kw = kant_fw["classification_rules"]["duty_keywords"]
            has_duty_terms = any(k in all_text for k in duty_kw)
            kant_analysis = {
                "categorical_test": (
                    "Would this decision rule remain coherent if every professional/operator adopted it universally? "
                    "Ensure your strategy does not rely on treating collaborators or existing commitments purely as transactional stepping stones."
                )
            }
            results.append(
                PhilosophyFrameworkResult(
                    framework_id=kant_fw["id"],
                    framework_name=kant_fw["framework_name"],
                    field=kant_fw["field"],
                    source=kant_fw["source"],
                    core_idea=kant_fw["core_idea"],
                    dimension_analysis=kant_analysis,
                    surfaced_questions=[q["question"] for q in kant_fw.get("lens_questions", [])]
                )
            )

        # 4. Aristotelian Virtue Ethics Framework
        virtue_fw = next((f for f in raw_fws if f["id"] == "virtue_ethics_v1"), None)
        if virtue_fw:
            virtue_analysis = {
                "character_formation_insight": (
                    "Aristotelian practical wisdom (phronesis) asks what habits and virtues of character the daily execution of each alternative cultivates. "
                    "Evaluate whether your leading alternative represents courageous prudence (the golden mean) or swings toward defensive inertia (deficiency) or reckless gamble (excess)."
                )
            }
            results.append(
                PhilosophyFrameworkResult(
                    framework_id=virtue_fw["id"],
                    framework_name=virtue_fw["framework_name"],
                    field=virtue_fw["field"],
                    source=virtue_fw["source"],
                    core_idea=virtue_fw["core_idea"],
                    dimension_analysis=virtue_analysis,
                    surfaced_questions=[q["question"] for q in virtue_fw.get("lens_questions", [])]
                )
            )

        return PhilosophyLayerResult(
            frameworks=results,
            stoic_legacy=legacy_stoic
        )
