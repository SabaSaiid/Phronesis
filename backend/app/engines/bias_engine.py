import json
import os
import functools
from typing import List, Dict, Any
from app.schemas.decision import StructuredDecision, FlaggedBiasPattern, BiasLayerResult

class BiasPatternEngine:
    """
    Cognitive Bias Pattern Matching Engine for V2 (15 Biases).
    Evaluates structured decisions against the human-curated static lookup table.
    Enforces Structural Grounding Tiers (explicit_variable vs narrative_nuance).
    """

    @classmethod
    @functools.lru_cache(maxsize=1)
    def get_knowledge_base(cls) -> List[dict]:
        kb_path = os.path.join(os.path.dirname(__file__), "..", "knowledge", "bias_patterns.json")
        with open(kb_path, "r", encoding="utf-8") as f:
            return json.load(f)

    @classmethod
    def evaluate(cls, decision: StructuredDecision) -> BiasLayerResult:
        kb = cls.get_knowledge_base()
        kb_map = {e["id"]: e for e in kb}
        flagged: List[FlaggedBiasPattern] = []

        statement_lower = decision.decision_statement.lower()
        alt_text = " ".join(a.description for a in decision.alternatives).lower()
        goals_text = " ".join(decision.goals).lower()
        constraints_text = " ".join(decision.constraints).lower()
        assumptions_text = " ".join(assump.text for assump in decision.assumptions).lower()
        unknowns_text = " ".join(decision.unknowns).lower()
        all_narrative_text = f"{statement_lower} {alt_text} {goals_text} {constraints_text} {assumptions_text} {unknowns_text}"

        utilities = [p.utility for p in decision.payoff_matrix]
        min_u = min(utilities) if utilities else 50.0
        max_u = max(utilities) if utilities else 50.0

        # 1. Sunk Cost Salience
        if "sunk_cost" in kb_map:
            e = kb_map["sunk_cost"]
            sunk_explicit = ["spent", "invested", "years", "tenure", "unvested", "rsu", "vesting", "already put in", "past effort"]
            matches = [k for k in sunk_explicit if k in all_narrative_text]
            if matches:
                # If mentioned in constraints or assumptions -> explicit variable
                is_explicit = any(k in constraints_text or k in assumptions_text for k in matches)
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger=f"References to historical investment detected ({', '.join(matches[:3])}).",
                        caveat_analysis="The reasoning incorporates past unrecoverable investments (time, tenure, or unvested stock) into the forward-looking evaluation.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="explicit_variable" if is_explicit else "narrative_nuance"
                    )
                )

        # 2. Loss Aversion / Asymmetric Downside Weighting
        if "loss_aversion" in kb_map:
            e = kb_map["loss_aversion"]
            loss_words = ["worry", "fear", "anxiety", "risk of failure", "worst case", "catastrophe", "dread"]
            has_loss_words = any(k in all_narrative_text for k in loss_words)
            has_utility_spread = (max_u - min_u >= 45.0)

            if has_utility_spread or has_loss_words:
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Wide spread between positive upside and severe downside penalty in payoff matrix." if has_utility_spread else "Narrative framing heavily emphasizes fear of failure.",
                        caveat_analysis="Downside failure outcomes appear heavily discounted in utility score. In behavioral economics, anticipated regret often looms ~2x larger than equivalent gains.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="explicit_variable" if has_utility_spread else "narrative_nuance"
                    )
                )

        # 3. Status Quo Bias
        if "status_quo_bias" in kb_map:
            e = kb_map["status_quo_bias"]
            sq_keywords = ["stay", "remain", "current job", "comfortable", "inertia", "keep current", "maintain current", "status quo"]
            if any(k in all_narrative_text for k in sq_keywords):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Dilemma explicitly compares an existing baseline position against an active transition.",
                        caveat_analysis="Status quo options frequently inherit default preference because continuing the present avoids transition friction, even when stagnation carries cumulative cost.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="explicit_variable"
                    )
                )

        # 4. Planning Fallacy / Optimism Skew
        if "planning_fallacy" in kb_map:
            e = kb_map["planning_fallacy"]
            venture_keywords = ["startup", "new venture", "launch", "seed", "pivot", "rewrite", "remodel", "renovation", "build internal"]
            is_venture = any(k in all_narrative_text for k in venture_keywords)
            high_p = any(s.prior_probability > 0.40 for s in decision.states_of_world if "win" in s.name.lower() or "succeed" in s.name.lower() or "scale" in s.name.lower())
            if is_venture and high_p:
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Optimistic success probability estimate (>40%) assigned to complex multi-variable endeavor.",
                        caveat_analysis="Early estimates of success probabilities and timelines for high-uncertainty endeavors systematically exceed empirical base rates.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="explicit_variable"
                    )
                )

        # 5. Confirmation Bias / Selective Hypothesis Weighting
        if "confirmation_bias" in kb_map and len(flagged) < 4:
            e = kb_map["confirmation_bias"]
            untestable = [a.text for a in decision.assumptions if not a.testable]
            if untestable or len(decision.assumptions) >= 2:
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Core assumptions rely on unverified future state projections without explicit falsification tests.",
                        caveat_analysis="Implicit assumptions often reflect desired narratives rather than independently verified empirical conditions.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 6. Anchoring & Adjustment
        if "anchoring_adjustment" in kb_map:
            e = kb_map["anchoring_adjustment"]
            anchor_keywords = ["salary", "$", "comp", "valuation", "benchmark", "historical", "budget cap", "priced at"]
            has_anchor = any(k in constraints_text or k in assumptions_text for k in anchor_keywords)
            if has_anchor and ("stay" in all_narrative_text or "buy" in all_narrative_text or "invest" in all_narrative_text):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Payoff utilities or constraints reference a specific historical benchmark or compensation figure.",
                        caveat_analysis="Decision estimates may be anchored to an initial reference figure rather than independent forward valuation.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="explicit_variable"
                    )
                )

        # 7. Availability Heuristic
        if "availability_heuristic" in kb_map:
            e = kb_map["availability_heuristic"]
            avail_keywords = ["ai wave", "recent layoff", "market news", "friend who", "headline", "saw online", "viral", "happened last week"]
            if any(k in all_narrative_text for k in avail_keywords):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Stated rationale mentions recent high-salience industry trends or vivid anecdotes.",
                        caveat_analysis="Vivid recent events often distort subjective probability assessments away from long-term statistical baselines.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 8. Framing Effect
        if "framing_effect" in kb_map:
            e = kb_map["framing_effect"]
            frame_loss_words = ["avoid losing", "protect against", "prevent disaster", "afraid of missing", "pass by"]
            if any(k in all_narrative_text for k in frame_loss_words):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Problem framing is constructed around loss avoidance rather than net positive expected return.",
                        caveat_analysis="Human risk appetite changes significantly depending on whether choices are phrased as potential losses vs. potential gains.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 9. Clustering Illusion / Hot Hand
        if "clustering_illusion" in kb_map:
            e = kb_map["clustering_illusion"]
            streak_keywords = ["streak", "momentum", "3 months in a row", "consecutive", "hot market", "wave passing"]
            if any(k in all_narrative_text for k in streak_keywords):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Stated assumptions treat short-term recent momentum as a persistent multi-year trajectory.",
                        caveat_analysis="Short-term sequences of positive feedback often reflect variance rather than permanent structural trends.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 10. Survivorship Bias
        if "survivorship_bias" in kb_map:
            e = kb_map["survivorship_bias"]
            survivor_keywords = ["unicorn", "success story", "others who made it", "top tier", "famous", "breakout"]
            if any(k in all_narrative_text for k in survivor_keywords):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Reasoning references high-profile breakout successes without balancing baseline cohort mortality.",
                        caveat_analysis="Evaluating strategies by inspecting only high-visibility winners masks the baseline attrition of identical attempts.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 11. Overconfidence Calibration Gap
        if "overconfidence_effect" in kb_map:
            e = kb_map["overconfidence_effect"]
            extreme_probs = any(s.prior_probability >= 0.85 or s.prior_probability <= 0.10 for s in decision.states_of_world)
            if extreme_probs and len(decision.states_of_world) >= 2:
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Extreme prior probability estimates (>=85% or <=10%) assigned to complex uncertain states.",
                        caveat_analysis="Subjective probability assessments on complex systems routinely exhibit narrower confidence bands than empirical data justifies.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="explicit_variable"
                    )
                )

        # 12. Omission Bias
        if "omission_bias" in kb_map:
            e = kb_map["omission_bias"]
            omission_words = ["afraid to make a mistake", "regret doing", "safer to do nothing", "hesitant to pull trigger"]
            if any(k in all_narrative_text for k in omission_words) or ("remain" in all_narrative_text and "stagnat" in all_narrative_text):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Tension between active commission risk and passive chronic stagnation.",
                        caveat_analysis="Harmful inactions are psychologically perceived as more tolerable than active missteps, even when inaction has higher cumulative cost.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 13. Endowment Effect
        if "endowment_effect" in kb_map:
            e = kb_map["endowment_effect"]
            endow_words = ["my equity", "my title", "my team", "built here", "my house", "my home", "relinquish", "give up"]
            if any(k in all_narrative_text for k in endow_words):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="High psychological weight placed on surrendering currently possessed roles, titles, or assets.",
                        caveat_analysis="Individuals systematically demand greater upside to relinquish an asset or status already possessed than they would pay to acquire it fresh.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="explicit_variable"
                    )
                )

        # 14. Hyperbolic Discounting / Present Bias
        if "hyperbolic_discounting" in kb_map:
            e = kb_map["hyperbolic_discounting"]
            present_words = ["immediate comfort", "short-term pain", "next month", "hassle", "too much friction now", "delay"]
            if any(k in all_narrative_text for k in present_words):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Weighting short-term transition friction heavily against multi-year strategic compound growth.",
                        caveat_analysis="Humans disproportionately overweight immediate discomfort relative to distant payoffs, compromising long-term compounding.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 15. Outcome Bias / Hindsight Conflation
        if "outcome_bias" in kb_map:
            e = kb_map["outcome_bias"]
            outcome_words = ["last time it worked", "worked out before", "turned out fine", "lucky last time"]
            if any(k in all_narrative_text for k in outcome_words):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Justifying forward probability estimates by referencing past successful gambles.",
                        caveat_analysis="Evaluating past decisions solely by their realized outcomes risks confusing lucky variance with sound reasoning.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # Keep the most salient 2 to 4 flags to maintain report focus
        return BiasLayerResult(flagged_patterns=flagged[:4])
