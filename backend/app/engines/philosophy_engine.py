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
from app.engines.base import BaseDeterministicEngine, EngineRegistry


@EngineRegistry.register
class PhilosophyEngine(BaseDeterministicEngine):
    """
    Multi-Framework Philosophy Engine (V3):
    Evaluates decisions across 8 parallel ethical and philosophical lenses:
    1. Stoic Decision Ethics (Dichotomy of Control & Indifferents)
    2. Utilitarian Consequentialism (Aggregate Well-being & Stakeholder Externalities)
    3. Kantian Deontology (Universalizability & Respect for Persons)
    4. Aristotelian Virtue Ethics (Character Cultivation & Golden Mean)
    5. Existentialist Ethics (Sartre / Beauvoir: Bad Faith & Radical Agency)
    6. Care Ethics (Gilligan / Noddings: Relational Vulnerability & Trust)
    7. American Pragmatism (James / Dewey: Living Hypotheses & Lived Consequence)
    8. Eastern Wisdom (Laozi / Nagarjuna: Wu Wei & Non-Attachment)

    Core Axiom: No framework is declared correct or privileged.
    """
    engine_id = "philosophy_engine_v1"
    engine_name = "Multi-Framework Philosophy Engine"
    layer_number = 3

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

        # 5. Existentialist Ethics (Sartre / Beauvoir)
        exist_fw = next((f for f in raw_fws if f["id"] == "existentialism_v1"), None)
        if exist_fw:
            bad_faith_kw = exist_fw["classification_rules"].get("bad_faith_keywords", [])
            authentic_kw = exist_fw["classification_rules"].get("authentic_agency_keywords", [])
            bad_faith_items = [k for k in bad_faith_kw if k in all_text]
            authentic_items = [k for k in authentic_kw if k in all_text]

            if bad_faith_items:
                exist_verdict = f"Bad Faith signals detected: [{', '.join(bad_faith_items[:3])}]. The narrative may be framing a freely chosen path as a compelled necessity."
            elif authentic_items:
                exist_verdict = f"Authentic agency signals detected: [{', '.join(authentic_items[:3])}]. The narrative appears to embrace full authorship of the choice."
            else:
                exist_verdict = "Neutral existential framing — neither strong bad-faith compulsion signals nor explicit authentic agency language detected. Examining whether external scripts are shaping the preference is indicated."

            exist_analysis = {
                "bad_faith_assessment": exist_verdict,
                "radical_freedom_note": (
                    "Sartre (1943) *Being and Nothingness*: Humans are 'condemned to be free' — there is no escape from authorship of one's choices. "
                    "De Beauvoir (1947) *The Ethics of Ambiguity* extends this: freedom is only genuinely exercised when the freedom of others is also affirmed."
                )
            }
            results.append(
                PhilosophyFrameworkResult(
                    framework_id=exist_fw["id"],
                    framework_name=exist_fw["framework_name"],
                    field=exist_fw["field"],
                    source=exist_fw["source"],
                    core_idea=exist_fw["core_idea"],
                    dimension_analysis=exist_analysis,
                    surfaced_questions=[q["question"] for q in exist_fw.get("lens_questions", [])]
                )
            )

        # 6. Care Ethics & Relational Ontology (Gilligan / Noddings)
        care_fw = next((f for f in raw_fws if f["id"] == "care_ethics_v1"), None)
        if care_fw:
            relational_kw = care_fw["classification_rules"].get("relational_keywords", [])
            relational_hits = [k for k in relational_kw if k in all_text]

            if relational_hits:
                care_verdict = (
                    f"Relational stakeholders identified: [{', '.join(relational_hits[:4])}]. "
                    "Care Ethics (Gilligan 1982) asks whose particular needs and vulnerabilities are being centered, "
                    "and whose relational reality is being abstracted away by aggregate utility language."
                )
            else:
                care_verdict = (
                    "No explicit relational stakeholder language detected. If the decision affects specific individuals "
                    "(partners, team members, dependents), Care Ethics (Gilligan 1982; Noddings 1984) suggests naming "
                    "and centering their particular needs rather than treating them as abstract 'stakeholders'."
                )

            care_analysis = {
                "relational_impact_assessment": care_verdict,
                "care_ethics_note": (
                    "Care Ethics reframes moral reasoning from universal principles to particular relationships. "
                    "Noddings (1984): The 'one-caring' bears responsibility not to the faceless 'other', "
                    "but to named, particular persons in vulnerable relationship."
                )
            }
            results.append(
                PhilosophyFrameworkResult(
                    framework_id=care_fw["id"],
                    framework_name=care_fw["framework_name"],
                    field=care_fw["field"],
                    source=care_fw["source"],
                    core_idea=care_fw["core_idea"],
                    dimension_analysis=care_analysis,
                    surfaced_questions=[q["question"] for q in care_fw.get("lens_questions", [])]
                )
            )

        # 7. American Pragmatism (James / Dewey)
        pragmatism_fw = next((f for f in raw_fws if f["id"] == "pragmatism_v1"), None)
        if pragmatism_fw:
            testable_kw = pragmatism_fw["classification_rules"].get("testable_outcome_keywords", [])
            testable_hits = [k for k in testable_kw if k in all_text]

            if testable_hits:
                pragmatic_verdict = (
                    f"Testable/empirical language detected: [{', '.join(testable_hits[:4])}]. "
                    "The Pragmatist lens (James 1907) asks: what specific, observable difference in lived experience "
                    "does choosing this path over others produce?"
                )
            else:
                pragmatic_verdict = (
                    "Abstract framing predominates — low density of testable, concrete outcome language. "
                    "Dewey (1922) argues that ideas have meaning only through their practical consequences. "
                    "Identifying a concrete, 90-day empirical test of the core assumption would ground this decision."
                )

            pragmatic_analysis = {
                "pragmatic_testability": pragmatic_verdict,
                "living_hypothesis_note": (
                    "James (1907) *Pragmatism*: 'True ideas are those that we can assimilate, validate, corroborate, and verify.' "
                    "Treat the preferred alternative as a living hypothesis — what specific evidence would falsify it within 3 months?"
                )
            }
            results.append(
                PhilosophyFrameworkResult(
                    framework_id=pragmatism_fw["id"],
                    framework_name=pragmatism_fw["framework_name"],
                    field=pragmatism_fw["field"],
                    source=pragmatism_fw["source"],
                    core_idea=pragmatism_fw["core_idea"],
                    dimension_analysis=pragmatic_analysis,
                    surfaced_questions=[q["question"] for q in pragmatism_fw.get("lens_questions", [])]
                )
            )

        # 8. Eastern Wisdom & Dynamic Non-Attachment (Laozi / Nagarjuna)
        eastern_fw = next((f for f in raw_fws if f["id"] == "eastern_flow_v1"), None)
        if eastern_fw:
            forcing_kw = eastern_fw["classification_rules"].get("forcing_resistance_keywords", [])
            flow_kw = eastern_fw["classification_rules"].get("flow_alignment_keywords", [])
            forcing_hits = [k for k in forcing_kw if k in all_text]
            flow_hits = [k for k in flow_kw if k in all_text]

            if forcing_hits:
                eastern_verdict = (
                    f"Resistance/forcing signals detected: [{', '.join(forcing_hits[:3])}]. "
                    "The Daoist lens (Laozi, *Dao De Jing*) observes that sustained effortful resistance against "
                    "the natural momentum of circumstances is characteristic of clinging — a source of suffering "
                    "rather than skillful engagement with reality."
                )
            elif flow_hits:
                eastern_verdict = (
                    f"Flow/alignment signals detected: [{', '.join(flow_hits[:3])}]. "
                    "Wu Wei (effortless action aligned with natural momentum) characterizes the preferred alternative's framing."
                )
            else:
                eastern_verdict = (
                    "Neutral framing — neither strong resistance nor flow signals detected. "
                    "The Buddhist principle of Anicca (impermanence) observes that all conditioned situations are "
                    "temporary — planning as if current conditions are permanent introduces structural fragility."
                )

            eastern_analysis = {
                "wu_wei_assessment": eastern_verdict,
                "impermanence_note": (
                    "Nagarjuna (*Mulamadhyamakakarika*, c. 150 CE): No permanent essence underlies any choice or outcome — "
                    "circumstances are interdependent and impermanent. Thich Nhat Hanh (1988): "
                    "'The present moment is the only moment available to us, and it is the door to all moments.'"
                )
            }
            results.append(
                PhilosophyFrameworkResult(
                    framework_id=eastern_fw["id"],
                    framework_name=eastern_fw["framework_name"],
                    field=eastern_fw["field"],
                    source=eastern_fw["source"],
                    core_idea=eastern_fw["core_idea"],
                    dimension_analysis=eastern_analysis,
                    surfaced_questions=[q["question"] for q in eastern_fw.get("lens_questions", [])]
                )
            )

        return PhilosophyLayerResult(
            frameworks=results,
            stoic_legacy=legacy_stoic
        )

