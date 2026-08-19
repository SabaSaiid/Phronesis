from app.schemas.decision import StructuredDecision, StoicAnalysisResult
from app.engines.philosophy_engine import PhilosophyEngine

class StoicPhilosophyEngine:
    """
    Philosophy Engine (Stoic Lens) - V1 Compatibility Adapter.
    Delegates to the unified V2 PhilosophyEngine.
    """

    @classmethod
    def evaluate(cls, decision: StructuredDecision) -> StoicAnalysisResult:
        res = PhilosophyEngine.evaluate(decision)
        if res.stoic_legacy:
            return res.stoic_legacy
        return StoicAnalysisResult(
            framework_id="stoicism_v1",
            framework_name="Stoic Decision Ethics (Epictetus / Marcus Aurelius)",
            field="hellenistic_philosophy",
            source="Epictetus, Enchiridion & Discourses; Hadot (The Inner Citadel)",
            dichotomy_of_control={
                "internal_controllables": ["Personal craft", "Savings rate", "Integrity"],
                "external_uncontrollables": ["Macro market", "Other people's choices"]
            },
            indifferents_analysis={"preferred_indifferents": ["Compensation", "Status"]},
            surfaced_questions=["Which elements represent external outcomes you cannot control?"]
        )
