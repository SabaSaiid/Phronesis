"""
Systems Thinking, Game Theory & Epistemic Antifragility Engine (Layer 5).

Deterministically evaluates decisions through three complementary lenses:
  1. Feedback Loop & Systems Dynamics (Meadows 2008)
  2. Game Theoretic Strategic Signaling (Spence 1973; Schelling 1960)
  3. Rawlsian Veil of Ignorance Fairness Audit (Rawls 1971)

Literature Foundation:
  - Meadows, D.H. (2008). Thinking in Systems: A Primer. Chelsea Green.
  - Spence, M. (1973). 'Job Market Signaling'. Quarterly Journal of Economics, 87(3), 355–374.
  - Schelling, T.C. (1960). The Strategy of Conflict. Harvard University Press.
  - Rawls, J. (1971). A Theory of Justice. Harvard University Press.
  - Von Neumann, J., & Morgenstern, O. (1944). Theory of Games and Economic Behavior. Princeton.
  - Axelrod, R. (1984). The Evolution of Cooperation. Basic Books.

CORE AXIOM: These analytical lenses reveal systemic and strategic dimensions of the decision
context. No game-theoretic or systems outcome is prescribed as objectively "correct."
"""
from typing import List, Dict, Optional, Any
from dataclasses import asdict

from app.schemas.decision import (
    StructuredDecision,
    SystemsLayerResult,
    FeedbackLoopResultSchema,
    GameTheoryResultSchema,
    RawlsianAuditResultSchema,
)
from app.engines.base import BaseDeterministicEngine, EngineRegistry


@EngineRegistry.register
class SystemsEngine(BaseDeterministicEngine):
    """
    Pure deterministic Systems Thinking, Game Theory & Epistemic Antifragility Engine.
    Zero LLM dependencies. All computation via keyword matching, structural analysis,
    and formal game-theoretic classification.
    """
    engine_id = "systems_engine_v1"
    engine_name = "Systems Thinking & Game Theory Engine"
    layer_number = 6

    @classmethod
    def evaluate(cls, decision: StructuredDecision, **kwargs: Any) -> SystemsLayerResult:
        """
        Evaluates the decision across systems dynamics, game theory, and Rawlsian fairness.
        """
        all_text = (
            decision.decision_statement + " " +
            " ".join(a.description for a in decision.alternatives) + " " +
            " ".join(decision.goals) + " " +
            " ".join(decision.constraints) + " " +
            " ".join(assump.text for assump in decision.assumptions) + " " +
            " ".join(decision.unknowns)
        ).lower()

        feedback_result = cls._analyze_feedback_loops(decision, all_text)
        game_theory_result = cls._analyze_game_theory(decision, all_text)
        rawlsian_result = cls._analyze_rawlsian_fairness(decision, all_text)

        synthesis = cls._synthesize(feedback_result, game_theory_result, rawlsian_result, decision)

        return SystemsLayerResult(
            feedback_loops=feedback_result,
            game_theory=game_theory_result,
            rawlsian_audit=rawlsian_result,
            systems_synthesis_narrative=synthesis,
        )

    @classmethod
    def _analyze_feedback_loops(cls, decision: StructuredDecision, all_text: str) -> FeedbackLoopResultSchema:
        """
        Identifies reinforcing (R) and balancing (B) feedback loops using Meadows (2008) vocabulary.
        """
        reinforcing_signals = [
            "compound", "compounding", "network effect", "viral", "momentum",
            "scale", "flywheel", "exponential", "snowball", "accelerate",
            "positive feedback", "growth loop", "reputation builds", "attracts more",
            "virtuous cycle", "cascade", "amplify"
        ]
        balancing_signals = [
            "market saturation", "diminishing returns", "limits", "ceiling",
            "competition increases", "regulatory", "burnout", "fatigue",
            "negative feedback", "stabilize", "plateau", "cap", "constraint",
            "equilibrium", "homeostasis", "throttle", "friction"
        ]
        delay_signals = [
            "months later", "eventually", "over time", "in a few years",
            "delayed", "lag", "slow", "gradual", "accumulate", "compound"
        ]

        r_loops: List[str] = []
        b_loops: List[str] = []

        # Reinforcing loops detection
        for sig in reinforcing_signals:
            if sig in all_text:
                r_loops.append(f"Detected reinforcing loop signal: '{sig}' — consistent with compounding growth or virtuous cycle dynamics (Meadows 2008, §3).")
                if len(r_loops) >= 2:
                    break

        # Balancing loops detection
        for sig in balancing_signals:
            if sig in all_text:
                b_loops.append(f"Detected balancing loop signal: '{sig}' — consistent with homeostatic or capacity-constrained dynamics (Meadows 2008, §4).")
                if len(b_loops) >= 2:
                    break

        # Default structural loops based on decision structure
        if not r_loops and len(decision.alternatives) >= 2:
            r_loops.append(
                "Career or resource-building alternatives commonly generate reinforcing feedback: "
                "skill acquisition enables better opportunities, which enable further skill investment "
                "(Meadows 2008 R-loop: Accumulation → Capability → Opportunity → Accumulation)."
            )
        if not b_loops:
            b_loops.append(
                "Resource and time constraints impose balancing loops on any alternative: "
                "sustained high-intensity effort depletes cognitive and physical reserves, "
                "creating natural throttling dynamics (Meadows 2008 B-loop)."
            )

        dominant = "Mixed"
        if len(r_loops) > len(b_loops):
            dominant = "Reinforcing"
        elif len(b_loops) > len(r_loops):
            dominant = "Balancing"

        # Delay analysis
        delay_detected = any(d in all_text for d in delay_signals)
        if delay_detected:
            delay_narrative = (
                "Time delays detected between actions and consequences. Meadows (2008, §7) identifies "
                "delays as a primary source of oscillation and overcompensation in systems. When consequences "
                "are delayed, early actions feel inconsequential — causing under-correction — followed by "
                "overcorrection when effects materialize. Accounting for this delay explicitly is indicated."
            )
        else:
            delay_narrative = (
                "No explicit temporal delay signals identified in the narrative. "
                "Short feedback loops (consequences rapidly visible) reduce the risk of dynamic overshoot "
                "or under-correction bias identified by Meadows (2008)."
            )

        # Leverage point
        leverage_narrative = (
            "Meadows (2008) identifies 'changing the rules of the system' and 'changing goals' as "
            "high-leverage intervention points — higher leverage than adjusting specific parameters. "
            "If any alternative involves changing the structure of the game (new role, new market, "
            "new framework) rather than optimizing within existing rules, it likely has higher "
            "systemic leverage than alternatives that adjust parameters within the current system."
        )

        return FeedbackLoopResultSchema(
            reinforcing_loops_detected=r_loops[:3],
            balancing_loops_detected=b_loops[:3],
            dominant_loop_type=dominant,
            delay_risk_narrative=delay_narrative,
            leverage_point_narrative=leverage_narrative,
        )

    @classmethod
    def _analyze_game_theory(cls, decision: StructuredDecision, all_text: str) -> GameTheoryResultSchema:
        """
        Applies game-theoretic strategic signaling analysis (Spence 1973; Schelling 1960).
        """
        # Game type classification
        zero_sum_signals = [
            "market share", "competitor", "beat", "outcompete", "win the deal",
            "negotiation", "salary negotiation", "take business", "zero sum",
            "fixed pie", "rank", "cut", "fire"
        ]
        positive_sum_signals = [
            "collaborate", "partnership", "expand market", "create value",
            "build together", "grow the pie", "ecosystem", "network", "together",
            "mutual benefit", "win-win", "alliance", "open source"
        ]
        positional_signals = [
            "status", "reputation", "title", "prestige", "career rank",
            "visible", "brand", "credential", "signal", "demonstrate"
        ]

        zero_sum_count = sum(1 for s in zero_sum_signals if s in all_text)
        positive_sum_count = sum(1 for s in positive_sum_signals if s in all_text)
        positional_count = sum(1 for s in positional_signals if s in all_text)

        if positional_count >= 2 and positional_count >= zero_sum_count:
            game_type = "Positional (Status / Credential Signaling)"
        elif zero_sum_count > positive_sum_count:
            game_type = "Zero-Sum / Competitive"
        elif positive_sum_count > zero_sum_count:
            game_type = "Positive-Sum / Collaborative"
        else:
            game_type = "Mixed Strategic"

        # Signaling credibility (Spence 1973)
        costly_signal_signals = [
            "quit", "leave", "resign", "commit fully", "all in", "invest savings",
            "give up salary", "costly", "irreversible move", "public commitment",
            "burn bridges", "accept lower salary"
        ]
        cheap_talk_signals = [
            "say", "claim", "promise", "tell them", "announce", "mention",
            "express interest", "send email", "verbal", "say i want"
        ]

        costly_count = sum(1 for s in costly_signal_signals if s in all_text)
        cheap_count = sum(1 for s in cheap_talk_signals if s in all_text)

        if costly_count >= 2:
            signaling_credibility = "High-Credibility Signal (Costly Action)"
            signaling_note = (
                f"Spence (1973): Costly signals — actions that are difficult and expensive to fake — "
                f"function as credible information transmission. The described commitment signals "
                f"involve genuine cost or sacrifice, making them structurally credible."
            )
        elif cheap_count >= 2 and costly_count == 0:
            signaling_credibility = "Cheap Talk (Low-Credibility Signal)"
            signaling_note = (
                f"Spence (1973): Statements or claims that any party could make without cost "
                f"carry low strategic credibility. If the strategy relies on communicating intent "
                f"without a costly commitment action, the signal may be discounted by counterparties."
            )
        else:
            signaling_credibility = "Ambiguous Strategic Signal"
            signaling_note = (
                "Signaling credibility is ambiguous — the narrative does not clearly distinguish "
                "between costly (high-credibility) and cheap-talk (low-credibility) signals. "
                "Schelling (1960) identifies commitment devices (burning bridges) as the mechanism "
                "for converting statements into credible strategic positions."
            )

        # Nash Equilibrium note
        nash_note = (
            "Von Neumann & Morgenstern (1944): In multi-player contexts, stable Nash equilibria emerge "
            "when each player's strategy is a best response to all others' strategies. If this decision "
            "involves counterparties (employers, investors, partners), examining whether your preferred "
            "alternative triggers a reactive response that erodes its expected utility is strategically indicated."
        )

        # Axelrod cooperation
        if positive_sum_count > 0:
            cooperation_note = (
                f"Axelrod (1984): In iterated multi-round interactions, cooperation strategies "
                f"(e.g., tit-for-tat) outperform defection strategies in the long run. If this "
                f"decision occurs within an ongoing relational game (career, partnership, community), "
                f"the cooperative alternative may yield higher compounding returns than the "
                f"strategically dominant single-round choice."
            )
        else:
            cooperation_note = (
                "Axelrod (1984): If this decision involves a one-shot, non-repeated interaction, "
                "cooperative considerations carry less strategic weight than in iterated games. "
                "Single-round game dynamics favor dominant strategy selection rather than "
                "cooperative reputation-building."
            )

        strategic_narrative = (
            f"**Game Type: {game_type}** — {signaling_note} {nash_note}"
        )

        return GameTheoryResultSchema(
            game_type=game_type,
            signaling_credibility=signaling_credibility,
            strategic_narrative=strategic_narrative,
            nash_equilibrium_note=nash_note,
            cooperation_vs_defection=cooperation_note,
        )

    @classmethod
    def _analyze_rawlsian_fairness(cls, decision: StructuredDecision, all_text: str) -> RawlsianAuditResultSchema:
        """
        Applies Rawlsian Veil of Ignorance fairness analysis (Rawls 1971).

        The Veil of Ignorance asks: if you did not know which stakeholder position
        you would occupy (decision-maker, most affected other, least advantaged party),
        would you still consider this choice just?
        """
        # Identify stakeholders from goals, constraints, unknowns
        stakeholder_signals = {
            "team": ["team", "employees", "staff", "colleagues"],
            "family": ["family", "partner", "spouse", "children", "parents"],
            "customers": ["customers", "users", "clients", "consumers"],
            "community": ["community", "society", "public", "neighbors"],
            "investors": ["investors", "shareholders", "board"],
        }

        detected_stakeholders = []
        for category, keywords in stakeholder_signals.items():
            if any(k in all_text for k in keywords):
                detected_stakeholders.append(category)

        # Identify least advantaged stakeholder
        if "team" in detected_stakeholders:
            least_advantaged = "Team members / employees who did not participate in this decision"
        elif "family" in detected_stakeholders:
            least_advantaged = "Family members or dependents who bear indirect consequences of the choice"
        elif "customers" in detected_stakeholders:
            least_advantaged = "End customers or users who have no voice in the decision"
        elif "community" in detected_stakeholders:
            least_advantaged = "Community members who experience externalities without representation"
        else:
            least_advantaged = "The individual decision-maker's future self under the worst-case state"

        # Maximin: identify the alternative with the highest minimum payoff
        utilities_per_alt: Dict[str, List[float]] = {}
        for alt in decision.alternatives:
            payoffs = [
                cell.utility for cell in decision.payoff_matrix
                if cell.alternative_id == alt.id
            ]
            utilities_per_alt[alt.id] = payoffs if payoffs else [50.0]

        min_payoffs = {alt_id: min(payoffs) for alt_id, payoffs in utilities_per_alt.items()}
        maximin_alt = max(min_payoffs, key=min_payoffs.get) if min_payoffs else None

        # Rawlsian verdict
        # Check if any single alternative concentrates most of the downside on non-decision-makers
        downside_concentration_signals = [
            "cut costs", "layoffs", "reduce team", "lower pay", "overtime",
            "burden the", "sacrifice", "at their expense", "they bear"
        ]
        downside_concentrated = any(s in all_text for s in downside_concentration_signals)

        if downside_concentrated:
            verdict = "Fails Rawlsian Test (Concentrated Downside)"
            fairness_narrative = (
                f"Rawls (1971) *Difference Principle*: Inequalities are permissible only if "
                f"they benefit the least-advantaged members of society. "
                f"The narrative exhibits signals of downside costs concentrated on '{least_advantaged}' "
                f"who are not direct decision-makers. Under the Veil of Ignorance — not knowing "
                f"whether you would occupy the decision-maker's or the most disadvantaged stakeholder's "
                f"position — the current framing may not satisfy the Difference Principle. "
                f"Examining whether less advantaged stakeholders receive a compensating benefit is indicated."
            )
        elif not detected_stakeholders:
            verdict = "Minimal Stakeholder Footprint"
            fairness_narrative = (
                f"Rawls (1971): The narrative primarily concerns the decision-maker's own position "
                f"without significant identified third-party stakeholder impacts. Rawlsian analysis "
                f"applies most forcefully where decisions affect the life opportunities of others — "
                f"particularly those with less power or voice. Standard maximin analysis applies: "
                f"the least-regret alternative is '{maximin_alt}'."
            )
        else:
            verdict = "Passes Initial Rawlsian Test"
            fairness_narrative = (
                f"Rawls (1971) *Veil of Ignorance*: Imagining that you could be assigned any "
                f"stakeholder position — including '{least_advantaged}' — this decision's impact "
                f"does not exhibit obvious signs of unjustly concentrated downside on the least "
                f"advantaged party. The maximin alternative (maximizing the worst-case outcome) is "
                f"'{maximin_alt}', which could serve as a fairness-prioritizing option under "
                f"Rawlsian constraints."
            )

        return RawlsianAuditResultSchema(
            least_advantaged_stakeholder=least_advantaged,
            veil_verdict=verdict,
            fairness_narrative=fairness_narrative,
            maximin_alternative=maximin_alt,
        )

    @staticmethod
    def _synthesize(
        feedback: FeedbackLoopResultSchema,
        game: GameTheoryResultSchema,
        rawls: RawlsianAuditResultSchema,
        decision: StructuredDecision,
    ) -> str:
        """
        Synthesizes all three systems-level analyses into a summary narrative.
        """
        return (
            f"**Systems Architecture Summary**\n\n"
            f"The decision exhibits a **{feedback.dominant_loop_type}** feedback structure "
            f"(Meadows 2008), with {len(feedback.reinforcing_loops_detected)} reinforcing and "
            f"{len(feedback.balancing_loops_detected)} balancing dynamics identified. "
            f"Strategically, the context maps most closely to a **{game.game_type}** game "
            f"(Von Neumann & Morgenstern 1944), with **{game.signaling_credibility}** "
            f"signal credibility (Spence 1973). "
            f"Under Rawlsian fairness analysis (Rawls 1971, *Veil of Ignorance*): "
            f"**{rawls.veil_verdict}**. "
            f"Maximin alternative (highest worst-case payoff): '{rawls.maximin_alternative}'."
        )
