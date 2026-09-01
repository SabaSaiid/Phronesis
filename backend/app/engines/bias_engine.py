import json
import os
import functools
from typing import List, Dict, Any
from app.schemas.decision import StructuredDecision, FlaggedBiasPattern, BiasLayerResult
from app.engines.base import BaseDeterministicEngine, EngineRegistry


@EngineRegistry.register
class BiasPatternEngine(BaseDeterministicEngine):
    """
    Cognitive Bias Pattern Matching Engine for V3 (25 Biases).
    Evaluates structured decisions against the human-curated static lookup table.
    Enforces Structural Grounding Tiers (explicit_variable vs narrative_nuance).
    """
    engine_id = "bias_engine_v1"
    engine_name = "Cognitive Psychology & Bias Pattern Engine"
    layer_number = 1

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

        # 16. Affect Heuristic / Emotional Valence Substitution
        if "affect_heuristic" in kb_map:
            e = kb_map["affect_heuristic"]
            affect_words = ["excited", "dread", "gut feeling", "just feels right", "feel good about", "scary", "thrilling", "repulsed"]
            if any(k in all_narrative_text for k in affect_words):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Emotional valence language (excitement, fear, disgust) appears as a primary driver of preference without quantitative grounding.",
                        caveat_analysis="The affect heuristic substitutes emotional charge for probabilistic risk-benefit computation. Vivid emotional responses correlate poorly with accurate risk assessment (Slovic et al. 2007).",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 17. Narrow Bracketing / Portfolio Isolation
        if "narrow_bracketing" in kb_map:
            e = kb_map["narrow_bracketing"]
            narrow_words = ["all or nothing", "everything on this", "only option", "this is my one shot", "binary choice"]
            has_single_income_constraint = any("only" in c.lower() and "income" in c.lower() for c in decision.constraints)
            if any(k in all_narrative_text for k in narrow_words) or has_single_income_constraint:
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Decision framed in all-or-nothing terms, without integrating existing portfolio assets or partial commitment options.",
                        caveat_analysis="Narrow bracketing treats this choice as a stand-alone event rather than one component of a broader life or financial portfolio, ignoring covariances and diversification (Read, Loewenstein, & Rabin 1999).",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 18. Durability Bias / Affective Forecasting Error
        if "durability_bias" in kb_map:
            e = kb_map["durability_bias"]
            durability_words = ["will never recover", "ruin my life", "catastrophic failure", "permanently damaged",
                                "destroy my reputation", "will be amazing forever", "best thing ever"]
            if any(k in all_narrative_text for k in durability_words):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Extreme permanence framing detected — projecting enduring catastrophic or euphoric emotional states far into the future.",
                        caveat_analysis="Affective forecasting errors (Gilbert & Wilson 2000) consistently show that the psychological immune system adapts more rapidly than anticipated. Both negative and positive emotional intensities attenuate within months of a major life change.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 19. IKEA Effect / Labor-Love Overvaluation
        if "ikea_effect" in kb_map:
            e = kb_map["ikea_effect"]
            ikea_words = ["built this", "i created", "my product", "my startup", "something i built", "our codebase", "my project"]
            if any(k in all_narrative_text for k in ikea_words):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Strong ownership or creative investment language detected — the decision may involve retaining or defending a self-built project or system.",
                        caveat_analysis="The IKEA Effect (Norton, Mochon, & Ariely 2012) produces systematic overvaluation of self-created objects relative to independently assessed market value.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 20. Social Proof Cascade / Informational Herding
        if "social_proof_cascade" in kb_map:
            e = kb_map["social_proof_cascade"]
            social_words = ["everyone is doing", "all my friends", "it's a trend", "everyone in my field",
                            "people i know are", "my peers are", "the market is moving to", "fomo"]
            if any(k in all_narrative_text for k in social_words):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Peer behavior or trend language appears as a significant driver of the preferred alternative's attractiveness.",
                        caveat_analysis="Social proof cascades (Bikhchandani et al. 1992) cause individuals to treat others' behavior as a substitute for independent probabilistic reasoning — potentially amplifying collective errors.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 21. Hot-Cold Empathy Gap
        if "hot_cold_empathy_gap" in kb_map:
            e = kb_map["hot_cold_empathy_gap"]
            hotcold_words = ["burned out", "exhausted", "fed up", "can't take it anymore", "desperate",
                             "extremely excited", "euphoric", "under pressure", "stressed", "anxious"]
            if any(k in all_narrative_text for k in hotcold_words):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Emotionally heightened or viscerally intense state indicators present — burnout, acute excitement, or high-pressure urgency shaping the decision context.",
                        caveat_analysis="Loewenstein (1996) demonstrates that visceral states (hunger, fatigue, stress, excitement) systematically alter preferences in predictable but underestimated ways. Decisions made in 'hot' states frequently diverge from 'cold-state' preferences.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 22. Cognitive Dissonance Shield
        if "cognitive_dissonance_shield" in kb_map:
            e = kb_map["cognitive_dissonance_shield"]
            cd_words = ["already decided", "made up my mind", "just looking for confirmation", "know what i want",
                        "just need someone to tell me it's okay", "validate my decision"]
            if any(k in all_narrative_text for k in cd_words):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Pre-decided conclusion language detected — the decision may be presented for validation rather than genuine deliberation.",
                        caveat_analysis="Festinger (1957): Cognitive dissonance motivates construction of post-hoc rationalizations rather than genuine evaluative reasoning. Distinguishing between decision-making and decision-justification is methodologically critical.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 23. Self-Handicapping
        if "self_handicapping" in kb_map:
            e = kb_map["self_handicapping"]
            sh_words = ["if it fails", "not my fault if", "circumstances beyond my control", "hedging my bets",
                        "strategic retreat", "safe option just in case"]
            if any(k in all_narrative_text for k in sh_words):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="External attribution language detected — framing that pre-allocates blame to circumstances if the preferred option fails.",
                        caveat_analysis="Berglas & Jones (1978): Self-handicapping protects self-esteem by creating external excuses for potential failure, but may systematically lead to under-commitment to higher-expected-value alternatives.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # 24. Base Rate Neglect
        if "base_rate_neglect" in kb_map:
            e = kb_map["base_rate_neglect"]
            base_words = ["i'm different", "but my case is unique", "exceptional", "not like others",
                          "unlike most people", "my situation is special"]
            user_p_high = any(s.prior_probability > 0.65 for s in decision.states_of_world
                              if any(w in s.name.lower() for w in ["success", "win", "achieve", "work out", "succeed"]))
            if any(k in all_narrative_text for k in base_words) or user_p_high:
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger=(
                            "Uniqueness or exceptionalism claims detected in narrative, or stated success probability materially exceeds typical empirical base rates for this domain."
                            if any(k in all_narrative_text for k in base_words)
                            else "High success probability (>65%) assigned to a complex multi-step outcome without explicit base rate reference."
                        ),
                        caveat_analysis="Kahneman & Tversky (1973): Base rate neglect causes individuals to judge their own case by vivid representativeness rather than the statistical frequency of success across comparable situations.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="explicit_variable" if user_p_high else "narrative_nuance"
                    )
                )

        # 25. Escalation of Commitment
        if "escalation_of_commitment" in kb_map:
            e = kb_map["escalation_of_commitment"]
            esc_words = ["too far in to stop", "already invested so much", "can't quit now", "give up",
                         "double down", "more resources", "stay the course despite", "despite the losses"]
            if any(k in all_narrative_text for k in esc_words):
                flagged.append(
                    FlaggedBiasPattern(
                        id=e["id"],
                        name=e["name"],
                        field=e["field"],
                        source=e["source"],
                        core_idea=e["core_idea"],
                        observed_trigger="Commitment escalation language detected — increasing investment triggered by prior sunk costs rather than updated expected future value.",
                        caveat_analysis="Staw (1976): Escalation of commitment is structurally distinct from rational perseverance — it is characterized by increasing resource allocation in the presence of negative trajectory evidence rather than genuine expected-value recalculation.",
                        question_to_surface=e["question_to_surface"],
                        grounding_tier="narrative_nuance"
                    )
                )

        # Return up to 6 most salient flags (expanded from 4) for comprehensive reporting
        return BiasLayerResult(flagged_patterns=flagged[:6])

