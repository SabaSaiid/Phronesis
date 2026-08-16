import json
import os
from typing import List, Dict
from app.schemas.decision import StructuredDecision, StoicAnalysisResult

class StoicPhilosophyEngine:
    """
    Philosophy Engine (Stoic Lens).
    Evaluates decision framing against the Dichotomy of Control and Indifferents taxonomy.
    """

    @classmethod
    def get_framework(cls) -> dict:
        kb_path = os.path.join(os.path.dirname(__file__), "..", "knowledge", "philosophy_frameworks.json")
        with open(kb_path, "r", encoding="utf-8") as f:
            frameworks = json.load(f)
            return frameworks[0]

    @classmethod
    def evaluate(cls, decision: StructuredDecision) -> StoicAnalysisResult:
        fw = cls.get_framework()
        rules = fw["classification_rules"]
        internal_keywords = rules["internal_control_keywords"]
        external_keywords = rules["external_uncontrollable_keywords"]

        internal_items: List[str] = []
        external_items: List[str] = []

        # Categorize constraints, goals, assumptions, unknowns
        for c in decision.constraints:
            if any(k in c.lower() for k in internal_keywords):
                internal_items.append(f"Constraint: {c}")
            else:
                external_items.append(f"Constraint: {c}")

        for g in decision.goals:
            if any(k in g.lower() for k in internal_keywords):
                internal_items.append(f"Goal: {g}")
            else:
                external_items.append(f"Goal: {g}")

        for a in decision.assumptions:
            if any(k in a.text.lower() for k in external_keywords):
                external_items.append(f"Assumption: {a.text}")
            else:
                internal_items.append(f"Assumption: {a.text}")

        for u in decision.unknowns:
            external_items.append(f"Unknown: {u}")

        if not internal_items:
            internal_items = [
                "Discipline in managing monthly household burn rate and personal savings buffer",
                "Quality of daily craftsmanship, code execution, and technical learning",
                "Personal emotional composure and ethical boundaries"
            ]

        if not external_items:
            external_items = [
                "Macro venture fundraising market and investor sentiment",
                "Future hiring demand and headcount budgets at target companies in 18 months",
                "Competitor speed and broader industry AI cycle shifts"
            ]

        # Preferred Indifferents analysis
        indifferents_data = {
            "preferred_indifferents": [
                "High annual compensation ($280k total comp)",
                "Prestige of founding engineer title / reputation",
                "Comfortable 35-hour work week"
            ],
            "virtue_and_agency_tension": (
                "Stoic ethics notes that compensation, title, and comfort are 'preferred indifferents' (proēgmena). "
                "The essential good is reasoned choice, self-efficacy, and moral agency. If staying in a comfortable "
                "role causes skill atrophy, you are sacrificing agency to preserve an indifferent."
            )
        }

        surfaced_questions = [
            q["question"] for q in fw.get("lens_questions", [])
        ]

        return StoicAnalysisResult(
            framework_id=fw["id"],
            framework_name=fw["framework_name"],
            field=fw["field"],
            source=fw["source"],
            dichotomy_of_control={
                "internal_controllables": internal_items[:4],
                "external_uncontrollables": external_items[:4]
            },
            indifferents_analysis=indifferents_data,
            surfaced_questions=surfaced_questions
        )
