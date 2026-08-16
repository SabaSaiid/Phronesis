import json
import os
from typing import List
from app.schemas.decision import StructuredDecision, FlaggedBiasPattern, BiasLayerResult

class BiasPatternEngine:
    """
    Cognitive Bias Pattern Matching Engine.
    Evaluates structured decisions against the human-curated, static lookup table.
    """
    
    @classmethod
    def get_knowledge_base(cls) -> List[dict]:
        kb_path = os.path.join(os.path.dirname(__file__), "..", "knowledge", "bias_patterns.json")
        with open(kb_path, "r", encoding="utf-8") as f:
            return json.load(f)

    @classmethod
    def evaluate(cls, decision: StructuredDecision) -> BiasLayerResult:
        kb = cls.get_knowledge_base()
        flagged: List[FlaggedBiasPattern] = []
        
        all_text = (
            decision.decision_statement + " " +
            " ".join(a.description for a in decision.alternatives) + " " +
            " ".join(decision.goals) + " " +
            " ".join(decision.constraints) + " " +
            " ".join(assump.text for assump in decision.assumptions) + " " +
            " ".join(decision.unknowns)
        ).lower()

        # 1. Check Sunk Cost
        sunk_cost_entry = next((e for e in kb if e["id"] == "sunk_cost"), None)
        if sunk_cost_entry:
            sunk_keywords = ["spent", "invested", "years", "tenure", "unvested", "rsu", "vesting", "past effort", "already put in"]
            matches = [k for k in sunk_keywords if k in all_text]
            if matches:
                flagged.append(
                    FlaggedBiasPattern(
                        id=sunk_cost_entry["id"],
                        name=sunk_cost_entry["name"],
                        field=sunk_cost_entry["field"],
                        source=sunk_cost_entry["source"],
                        core_idea=sunk_cost_entry["core_idea"],
                        observed_trigger=f"References to historical investment detected ({', '.join(matches[:3])}).",
                        caveat_analysis="The reasoning incorporates past investments (time, tenure, or unvested stock) into the forward-looking choice. Economically, unrecoverable past investments cannot be altered by future decisions.",
                        question_to_surface=sunk_cost_entry["question_to_surface"]
                    )
                )

        # 2. Check Loss Aversion / Asymmetric Downside Weighting
        loss_aversion_entry = next((e for e in kb if e["id"] == "loss_aversion"), None)
        if loss_aversion_entry:
            # Check if any failure state payoff is < 35 while status quo payoff is >= 65
            utilities = [p.utility for p in decision.payoff_matrix]
            min_u = min(utilities) if utilities else 50.0
            max_u = max(utilities) if utilities else 50.0
            loss_keywords = ["worry", "fear", "anxiety", "risk of failure", "worst case", "catastrophe"]
            has_loss_words = any(k in all_text for k in loss_keywords)
            
            if (max_u - min_u >= 45.0) or has_loss_words:
                flagged.append(
                    FlaggedBiasPattern(
                        id=loss_aversion_entry["id"],
                        name=loss_aversion_entry["name"],
                        field=loss_aversion_entry["field"],
                        source=loss_aversion_entry["source"],
                        core_idea=loss_aversion_entry["core_idea"],
                        observed_trigger="Wide spread between positive upside and severe negative downside penalty.",
                        caveat_analysis="Downside failure outcomes appear heavily discounted in utility score. In human decision-making, anticipated regret from an action often looms 2x larger than satisfaction from an equivalent gain.",
                        question_to_surface=loss_aversion_entry["question_to_surface"]
                    )
                )

        # 3. Check Status Quo Inertia
        status_quo_entry = next((e for e in kb if e["id"] == "status_quo_bias"), None)
        if status_quo_entry:
            sq_keywords = ["stay", "remain", "current job", "comfortable", "inertia", "keep current", "stagnat"]
            if any(k in all_text for k in sq_keywords):
                flagged.append(
                    FlaggedBiasPattern(
                        id=status_quo_entry["id"],
                        name=status_quo_entry["name"],
                        field=status_quo_entry["field"],
                        source=status_quo_entry["source"],
                        core_idea=status_quo_entry["core_idea"],
                        observed_trigger="Dilemma compares an existing baseline/status-quo position against an active transition.",
                        caveat_analysis="Status quo options frequently inherit default preference because continuing the present avoids transition friction, even when stagnation carries high cumulative cost.",
                        question_to_surface=status_quo_entry["question_to_surface"]
                    )
                )

        # 4. Check Planning Fallacy
        planning_entry = next((e for e in kb if e["id"] == "planning_fallacy"), None)
        if planning_entry:
            # Check if highest success probability is estimated > 0.40 for high-uncertainty venture
            startup_keywords = ["startup", "new venture", "launch", "seed", "pivot"]
            is_venture = any(k in all_text for k in startup_keywords)
            high_p = any(s.prior_probability > 0.45 for s in decision.states_of_world if "win" in s.name.lower() or "succeed" in s.name.lower())
            if is_venture and high_p:
                flagged.append(
                    FlaggedBiasPattern(
                        id=planning_entry["id"],
                        name=planning_entry["name"],
                        field=planning_entry["field"],
                        source=planning_entry["source"],
                        core_idea=planning_entry["core_idea"],
                        observed_trigger="Optimistic success probability estimate on high-uncertainty multi-variable endeavor.",
                        caveat_analysis="Early estimates of success probabilities for early-stage ventures often exceed historic base rates by 2x to 3x.",
                        question_to_surface=planning_entry["question_to_surface"]
                    )
                )

        # 5. Check Confirmation Bias
        confirmation_entry = next((e for e in kb if e["id"] == "confirmation_bias"), None)
        if confirmation_entry and len(flagged) < 2:
            untestable_assumptions = [a.text for a in decision.assumptions if not a.testable]
            if untestable_assumptions or len(decision.assumptions) >= 2:
                flagged.append(
                    FlaggedBiasPattern(
                        id=confirmation_entry["id"],
                        name=confirmation_entry["name"],
                        field=confirmation_entry["field"],
                        source=confirmation_entry["source"],
                        core_idea=confirmation_entry["core_idea"],
                        observed_trigger="Core assumptions rely on unverified future state projections.",
                        caveat_analysis="Implicit assumptions often reflect desired narratives rather than independently verified conditions.",
                        question_to_surface=confirmation_entry["question_to_surface"]
                    )
                )

        return BiasLayerResult(flagged_patterns=flagged)
