import json
import re
import time
from typing import List, Dict, Any, Optional
from app.schemas.decision import (
    DeliberationRequest,
    DeliberationResponse,
    SuggestedActionSchema,
    SourceAttribution,
    StructuredDecision
)
from app.services.llm_client import LLMClient

LENS_METADATA: Dict[str, Dict[str, str]] = {
    "socratic": {
        "name": "Socratic Inquirer",
        "field": "Classical Dialectic",
        "source": "Plato, Gorgias & Paul & Elder, Critical Thinking Framework",
        "description": "Probes unstated assumptions, challenges causal links, and isolates the single pivotal unknown."
    },
    "steelman": {
        "name": "Devil's Advocate & Steelmanner",
        "field": "Critical Rationalism",
        "source": "John Stuart Mill, On Liberty & Daniel Dennett, Intuition Pumps",
        "description": "Constructs the most formidable, articulate counter-argument against your dominant preference."
    },
    "stoic": {
        "name": "Stoic Dialectic Counselor",
        "field": "Hellenistic Philosophy",
        "source": "Epictetus, Enchiridion & Marcus Aurelius, Meditations",
        "description": "Applies the Dichotomy of Control to delineate internal agency from external indifferents."
    },
    "kantian": {
        "name": "Kantian Deontologist",
        "field": "Moral Philosophy",
        "source": "Immanuel Kant, Groundwork of the Metaphysics of Morals",
        "description": "Tests the universalizability of your decision rule and ensures stakeholders are treated as ends."
    },
    "utilitarian": {
        "name": "Utilitarian Optimizer",
        "field": "Normative Consequentialism",
        "source": "Jeremy Bentham & J.S. Mill, Utilitarianism",
        "description": "Audits aggregate multi-stakeholder flourishing, downside asymmetry, and systemic externalities."
    },
    "virtue": {
        "name": "Aristotelian Virtue Ethicist",
        "field": "Classical Greek Ethics",
        "source": "Aristotle, Nicomachean Ethics",
        "description": "Evaluates character habits and identifies the Golden Mean between excess and deficiency."
    },
    "voi": {
        "name": "48-Hour VoI Protocol Builder",
        "field": "Decision Theory & Information Economics",
        "source": "Douglas Hubbard, How to Measure Anything & Ronald Howard",
        "description": "Designs low-cost (<$100, <4h), highly falsifiable real-world experiments before locking in choices."
    },
    "bias": {
        "name": "Cognitive Bias Auditor",
        "field": "Behavioral Economics",
        "source": "Kahneman & Tversky, Judgment under Uncertainty",
        "description": "Screens for systematic psychological distortions such as sunk cost, anchoring, and overconfidence."
    }
}

class DeliberationService:
    """
    Orchestrates multi-perspective Socratic dialogues with decision context,
    structured model injection suggestions, and dynamic follow-up chips.
    """

    @classmethod
    async def deliberate(cls, req: DeliberationRequest) -> DeliberationResponse:
        lens = req.lens or "socratic"
        if lens not in LENS_METADATA:
            lens = "socratic"

        lens_meta = LENS_METADATA[lens]
        attribution = SourceAttribution(
            field=lens_meta["field"],
            source=lens_meta["source"],
            referenced_item=lens_meta["name"]
        )

        user_query = ""
        if req.messages:
            # Last user message
            user_msgs = [m for m in req.messages if m.sender == "user"]
            if user_msgs:
                user_query = user_msgs[-1].text

        if not user_query.strip():
            user_query = "What should I examine first in this dilemma?"

        # 1. Attempt LLM generation if available
        try:
            llm_result = await cls._generate_llm_deliberation(req, lens, lens_meta, user_query)
            if llm_result:
                return llm_result
        except Exception as e:
            print(f"[DeliberationService Warning] LLM generation failed: {e}. Using deterministic synthesis.")

        # 2. Deterministic heuristic synthesis fallback
        return cls._generate_heuristic_deliberation(req, lens, lens_meta, user_query)

    @classmethod
    async def _generate_llm_deliberation(
        cls,
        req: DeliberationRequest,
        lens: str,
        lens_meta: Dict[str, str],
        user_query: str
    ) -> Optional[DeliberationResponse]:
        from app.core.config import settings
        import os
        api_key = settings.LLM_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY") or os.environ.get("ANTHROPIC_API_KEY")
        if not api_key or (settings.LLM_PROVIDER or "").lower() == "mock":
            return None

        # Build context prompt
        context_parts = []
        if req.structured_decision:
            sd = req.structured_decision
            context_parts.append(f"Decision Statement: {sd.decision_statement}")
            context_parts.append(f"Alternatives: {', '.join(a.name for a in sd.alternatives)}")
            if sd.assumptions:
                context_parts.append(f"Key Assumptions: {', '.join(a.text for a in sd.assumptions[:4])}")
            if sd.unknowns:
                context_parts.append(f"Unknowns: {', '.join(sd.unknowns[:3])}")
        
        if req.math_summary:
            ms = req.math_summary
            if "preferred_eu_alt" in ms:
                context_parts.append(f"Highest Expected Utility Alternative: {ms['preferred_eu_alt']}")
            if "minimax_regret_choice" in ms:
                context_parts.append(f"Minimax Regret Choice: {ms['minimax_regret_choice']}")
            if "inflection_threshold" in ms:
                context_parts.append(f"Algebraic Sensitivity Flipping Threshold: {ms['inflection_threshold']:.2f}")

        if req.flagged_biases:
            context_parts.append(f"Flagged Cognitive Biases: {', '.join(req.flagged_biases)}")

        context_str = "\n".join(context_parts) if context_parts else "No structured decision model provided yet."

        # History summary (last 4 messages)
        history_str = ""
        if len(req.messages) > 1:
            prev = req.messages[-4:-1]
            history_str = "\n".join([f"{m.sender.capitalize()}: {m.text}" for m in prev])

        system_prompt = f"""You are Phronesis's Socratic Deliberation Engine embodying the perspective of '{lens_meta['name']}' ({lens_meta['field']}, Source: {lens_meta['source']}).
Core Mandate:
- Do NOT make choices for the user or tell them what to pick.
- Challenge framing, expose unstated assumptions, and stress-test trade-offs using the specific intellectual rigor of the active lens ({lens}).
- Respond in rich, elegant, structured Markdown (using bold headers, bullet lists, blockquotes for classical maxims, and a concluding dialectic question).
- If appropriate, suggest 1 concrete model action (e.g. inserting an unconsidered 3rd alternative, a testable assumption, or a 48h VoI experiment).
- Suggest exactly 3 brief follow-up prompt chips (max 6-8 words each) that the user might ask next.

Return a JSON object with schema:
{{
  "reply_text": "Markdown string containing your philosophical/analytical inquiry...",
  "suggested_action": {{
    "action_type": "insert_alternative" | "insert_assumption" | "append_narrative" | "test_protocol",
    "label": "Short button label (e.g., 'Add Hybrid Alternative C')",
    "text_to_insert": "Text to insert or append",
    "alternative_data": {{ "name": "...", "description": "..." }} (optional),
    "assumption_data": {{ "text": "...", "type": "empirical", "testable": true }} (optional)
  }} (or null),
  "suggested_followups": ["Followup Question 1", "Followup Question 2", "Followup Question 3"]
}}"""

        user_prompt = f"""Context:
{context_str}

Recent Conversation:
{history_str}

User Inquiry ({req.current_step} step):
{user_query}"""

        resp_json = await LLMClient.generate_structured_json(system_prompt, user_prompt)
        if not resp_json or "reply_text" not in resp_json:
            return None

        action = None
        if resp_json.get("suggested_action"):
            act = resp_json["suggested_action"]
            action = SuggestedActionSchema(
                action_type=act.get("action_type", "append_narrative"),
                label=act.get("label", "Insert Insight"),
                text_to_insert=act.get("text_to_insert", ""),
                alternative_data=act.get("alternative_data"),
                assumption_data=act.get("assumption_data")
            )

        followups = resp_json.get("suggested_followups", [])
        if not isinstance(followups, list) or len(followups) == 0:
            followups = cls._get_default_followups(lens, req.current_step or "input")

        return DeliberationResponse(
            reply_text=resp_json["reply_text"],
            suggested_action=action,
            suggested_followups=followups[:3],
            attribution=SourceAttribution(
                field=lens_meta["field"],
                source=lens_meta["source"],
                referenced_item=lens_meta["name"]
            ),
            lens_used=lens
        )

    @classmethod
    def _generate_heuristic_deliberation(
        cls,
        req: DeliberationRequest,
        lens: str,
        lens_meta: Dict[str, str],
        user_query: str
    ) -> DeliberationResponse:
        sd = req.structured_decision
        query_lower = user_query.lower()
        step = req.current_step or "input"

        alt_names = [a.name for a in sd.alternatives] if sd and sd.alternatives else ["Option A", "Option B"]
        first_alt = alt_names[0]
        second_alt = alt_names[1] if len(alt_names) > 1 else "Status Quo"
        statement = sd.decision_statement if sd and sd.decision_statement else "your active dilemma"

        reply = ""
        action: Optional[SuggestedActionSchema] = None
        followups: List[str] = []

        if lens == "stoic":
            reply = f"""### Stoic Dichotomy of Control & Agency Audit

> *"Some things are in our control and others not. Things in our control are opinion, pursuit, desire, aversion, and, in a word, whatever are our own actions. Things not in our control are body, property, reputation, command, and whatever are not our own actions."* — **Epictetus, Enchiridion §1**

When examining **"{statement}"**, we must distinguish between your sphere of moral agency and external *indifferents* (*adiaphora*):

1. **Within Your Direct Agency (Internal Sovereignty)**:
   - Your preparation rigor, adherence to integrity, emotional composure under ambiguity, and discipline of execution.
2. **External Indifferents (Beyond Direct Sovereignty)**:
   - Counterparty decisions, market conditions, economic shifts, macroeconomic interest rates, and other people's opinions.

**Diagnostic Tension:** Are you placing your peace of mind on securing an external outcome (e.g. status, guarantee of financial upside) rather than executing with excellence regardless of the outcome?

*Dialectical Question:* If external circumstance forces the dispreferred outcome tomorrow, what internal virtue remains completely intact?"""
            action = SuggestedActionSchema(
                action_type="insert_assumption",
                label="Add Stoic Agency Assumption",
                text_to_insert=" Stoic Agency Assumption: Success is defined by diligence and virtue of execution, not uncontrollable market outcomes.",
                assumption_data={
                    "text": "Success is defined by diligence of execution rather than external macroeconomic factors",
                    "type": "value_attribution",
                    "testable": False
                }
            )
            followups = [
                "What is the worst uncontrollable downside?",
                "How do I detach ego from the outcome?",
                "Which assumption relies on external luck?"
            ]

        elif lens == "steelman":
            reply = f"""### Steelmanned Counter-Thesis (Devil's Advocate)

To eliminate confirmation bias, we must articulate the **strongest, most compelling justification** for the alternative you currently find least attractive (**{second_alt}**):

```markdown
Counter-Thesis Proposition:
Choosing {second_alt} is not merely a timid baseline; it is a calculated conservation of optionality.
```

#### Core Structural Strengths of the Opposing Path:
1. **Preservation of Liquidity & Bandwidth**: Maintaining {second_alt} retains your reserves for asymmetric opportunities when market valuations or clarity improve.
2. **Asymmetric Downside Protection**: It avoids irreversible commitments, high transition friction, and unrecoverable capital burn.
3. **Execution Simplicity**: It circumvents the severe operational overhead and hidden multi-step dependencies inherent in {first_alt}.

*Dialectical Challenge:* What specific empirical signal would force you to concede that the counter-thesis was right all along?"""
            action = SuggestedActionSchema(
                action_type="insert_assumption",
                label="Add Counter-Thesis Test",
                text_to_insert=" Counter-Thesis Falsification Metric: If revenue or validation metrics fall below threshold X in 60 days, default to conservative baseline.",
                assumption_data={
                    "text": "Counter-thesis holds if milestone threshold is missed within 60 days",
                    "type": "empirical",
                    "testable": True
                }
            )
            followups = [
                "How can I steelman Option A instead?",
                "What is the cost of staying passive?",
                "Where is my confirmation bias highest?"
            ]

        elif lens == "kantian":
            reply = f"""### Kantian Deontological & Universalizability Audit

> *"Act only according to that maxim whereby you can at the same time will that it should become a universal law."* — **Immanuel Kant, Groundwork (1785)**

In deliberating **"{statement}"**, we apply Kant's dual formulations of the Categorical Imperative:

#### 1. The Universal Law Formulation
- What is the underlying universal maxim of your choice? *(e.g., "Whenever uncertainty increases, prioritize short-term safety" or "Pursue high upside regardless of previous stakeholder commitments".)*
- If every decision-maker in your exact position universally adopted this maxim, would the ecosystem remain stable and coherent, or would trust and predictability break down?

#### 2. The Formula of Humanity (Ends vs. Means)
- Are you treating any stakeholder, colleague, family member, or future version of yourself merely as an instrumental tool to reach a financial milestone?
- Does your choice preserve the sovereign dignity and informed consent of everyone impacted?

*Dialectical Inquiry:* Does your preferred alternative depend on an unreciprocated exception made solely for your benefit?"""
            followups = [
                "Are any stakeholder promises strained?",
                "What is the underlying maxim of my choice?",
                "How does this treat my future self?"
            ]

        elif lens == "utilitarian":
            reply = f"""### Utilitarian Multi-Stakeholder Payoff Audit

> *"Actions are right in proportion as they tend to promote happiness, wrong as they tend to produce the reverse of happiness."* — **J.S. Mill, Utilitarianism (1861)**

Evaluating **"{statement}"** through aggregate expected net flourishing vs. suffering across all affected parties over a 3-year horizon:

| Stakeholder Group | Impact under **{first_alt}** | Impact under **{second_alt}** | Net Utility Vector |
| :--- | :--- | :--- | :--- |
| **You (Decision-Maker)** | High autonomy, high upside volatility | Stability, lower stress, capped upside | Differential: +Δ Variance |
| **Direct Stakeholders / Family** | Shared volatility, potential payoff upside | Predictability, baseline security | Differential: Risk Burden |
| **Broader Community / Team** | Value creation, new innovation capacity | Continuity, baseline execution | Differential: Positive Externalities |

#### Critical Consequentialist Warning:
Beware **negative externalities**: Does your preferred choice concentrate upside on yourself while offloading non-consensual downside or burn onto those around you?

*Dialectical Inquiry:* If you could multiply total net flourishing by 2x at the expense of a 20% personal utility sacrifice, would you accept it?"""
            followups = [
                "Who bears the hidden downside cost?",
                "How does the 3-year payoff compare to 6-month?",
                "What negative externalities exist?"
            ]

        elif lens == "virtue":
            reply = f"""### Aristotelian Virtue Ethics & Character Formation

> *"Excellence is an art won by training and habituation. We do not act rightly because we have virtue or excellence, but we rather have those because we have acted rightly."* — **Aristotle, Nicomachean Ethics**

Deliberating **"{statement}"** through the lens of practical wisdom (*phronesis*) and the **Doctrine of the Mean**:

```
[Deficiency: Cowardice / Timidity] <─── [THE GOLDEN MEAN: Courage / Phronesis] ───> [Excess: Rash Overreach]
```

1. **The Doctrine of the Mean**:
   - Is choosing **{first_alt}** an act of calibrated courage, or does it cross into reckless presumption without adequate buffers?
   - Is choosing **{second_alt}** prudent stewardship, or does it stem from paralyzing loss aversion?
2. **Habit & Identity Formation**:
   - Irrespective of whether this endeavor succeeds or fails financially, what kind of thinker and leader will the daily execution of this path train you to become?

*Dialectical Inquiry:* Which choice builds the intellectual fortitude and character you want to inhabit ten years from now?"""
            followups = [
                "Am I acting out of fear or practical wisdom?",
                "What habits will daily execution cultivate?",
                "Where is the Golden Mean in this tradeoff?"
            ]

        elif lens == "voi":
            reply = f"""### 48-Hour Value of Information (VoI) Falsification Protocol

> *"Before making an irreversible high-stakes commitment, spend a fraction of time and cost to measure the single variable that carries the highest reduction of uncertainty."* — **Douglas Hubbard**

For your decision **"{statement}"**, do not leap into a permanent choice under raw guesswork. Execute a rapid, non-destructive probe:

#### 3 Criteria for a High-Leverage 48h VoI Test:
1. **Cost Ceiling**: Total monetary expenditure < $100 & time investment < 4 hours.
2. **Asymmetric Falsifiability**: The observation must have the power to decisively refute your dominant optimistic assumption.
3. **Direct Contact with Reality**: Structured discovery calls, contract audits, or synthetic pre-sale validation.

#### Recommended 48-Hour Protocol:
- **Test Objective**: Verify whether core demand / runway / valuation assumptions hold with empirical stakeholders.
- **Protocol Action**: Conduct 3 structured 20-minute adversarial discovery interviews or audit historical base rates with domain practitioners.
- **Flipping Threshold**: If >= 2 out of 3 signals are negative, downgrade prior probability from 0.70 to 0.35."""
            action = SuggestedActionSchema(
                action_type="test_protocol",
                label="Add 48h Falsification Protocol",
                text_to_insert=" 48-Hour VoI Protocol: Conduct 3 structured discovery interviews within 48 hours to validate whether the core payoff assumption holds before locking in commitment.",
                assumption_data={
                    "text": "48h VoI Protocol: 3 stakeholder discovery interviews must validate payoff assumptions",
                    "type": "empirical",
                    "testable": True
                }
            )
            followups = [
                "How do I design a test for under $50?",
                "What is the single most sensitive variable?",
                "What observable signal would flip my choice?"
            ]

        elif lens == "bias":
            reply = f"""### Cognitive Bias & Heuristic Distortion Audit

Auditing the psychological friction points in **"{statement}"**:

#### 1. Sunk Cost Salience & Past Tenure
- Are you factoring historical capital, emotional energy, or years of service that can never be recovered?
- *Remedy:* Evaluate all options strictly on forward-looking incremental expected return from this instant ($t=0$).

#### 2. Asymmetric Loss Aversion ($λ ≈ 2.25$)
- Behavioral economics shows losses cause ~2.25x the psychological distress of equivalent gains.
- Are you rejecting a mathematically superior positive expected utility alternative solely because the word "failure" induces visceral discomfort?

#### 3. Base-Rate Neglect
- Treating your scenario as an exceptional outlier while ignoring empirical reference class success rates (e.g. startup survival rates, career pivot timelines).

*Dialectical Question:* If a trusted peer came to you with this identical data, what unbiased advice would you give them from an external vantage point?"""
            action = SuggestedActionSchema(
                action_type="insert_assumption",
                label="Add Bias Calibration Check",
                text_to_insert=" Cognitive Calibration Note: Check for sunk cost entanglement and apply a 2x loss-aversion re-weighting.",
                assumption_data={
                    "text": "Decision evaluated on forward marginal utility from t=0 ignoring sunk costs",
                    "type": "empirical",
                    "testable": True
                }
            )
            followups = [
                "Am I falling victim to sunk cost fallacy?",
                "How do I adjust for loss aversion?",
                "What empirical base rate applies here?"
            ]

        else: # Default Socratic Inquirer
            if "blind spot" in query_lower or "assumption" in query_lower:
                reply = f"""### Socratic Blind Spot Examination

When deliberating **"{statement}"**, unstated assumptions frequently masquerade as established facts:

1. **False Dichotomy**: Are you framing this choice as a rigid binary between **{first_alt}** and **{second_alt}**, when a staged, milestone-gated hybrid is possible?
2. **Untested Monotonicity**: Assuming that putting in 2x effort or taking 2x risk will linearly yield 2x payoff.
3. **Temporal Asymmetry**: Over-indexing on the first 6 months of transition turbulence while under-weighting years 2 through 5.

#### Recommended 3rd Alternative:
- **Hybrid Parallel De-risking**: Maintain your current baseline while dedicating a strict, time-boxed 10 hours/week to develop the alternative for 90 days before making an irreversible leap.

*Dialectical Inquiry:* Which of your stated assumptions rests on empirical data rather than hopeful extrapolation?"""
                action = SuggestedActionSchema(
                    action_type="insert_alternative",
                    label="Add Hybrid Alternative C",
                    text_to_insert=" Alternative 3: Hybrid Parallel De-risking (maintain primary baseline while committing time-boxed 10h/week over 90-day milestone gate).",
                    alternative_data={
                        "name": "Hybrid Parallel De-risking",
                        "description": "Maintain baseline while executing a 90-day milestone-gated exploration"
                    }
                )
                followups = [
                    "How can I test this in 48 hours?",
                    "What would Epictetus say about this?",
                    "What is the least testable assumption?"
                ]
            else:
                reply = f"""### Socratic Inquiry: Examining Your Decision Structure

Reflecting on your dilemma: **"{statement}"**

Let us dissect the underlying mechanics of your reasoning:

1. **The Pivotal Flipping Unknown**: What single piece of empirical information, if verified with 90% confidence tomorrow, would cause you to completely reverse your leading preference?
2. **Irreversibility & Downside Containment**: If you commit to **{first_alt}** and it fails catastrophically, how long would it take to recover your baseline?
3. **Regret Asymmetry**: Which regret is more corrosive to your character: the regret of taking action and failing, or the regret of passive inaction and wondering what could have been?

*Dialectical Inquiry:* What is the hardest truth about this dilemma that you have been reluctant to state in writing?"""
                followups = [
                    "Surface my blind spots",
                    "Steelman the alternative path",
                    "Apply the Stoic dichotomy of control"
                ]

        return DeliberationResponse(
            reply_text=reply,
            suggested_action=action,
            suggested_followups=followups[:3],
            attribution=SourceAttribution(
                field=lens_meta["field"],
                source=lens_meta["source"],
                referenced_item=lens_meta["name"]
            ),
            lens_used=lens
        )

    @classmethod
    def _get_default_followups(cls, lens: str, step: str) -> List[str]:
        defaults = {
            "socratic": ["Surface my blind spots", "Isolate key flipping unknown", "Steelman the alternative path"],
            "steelman": ["What is the cost of inaction?", "How do I defend Option A?", "Where is my confirmation bias highest?"],
            "stoic": ["What is outside my control?", "How do I detach from outcome anxiety?", "What virtue is tested here?"],
            "kantian": ["Is my rule universalizable?", "Are any promises strained?", "Who is treated as a means?"],
            "utilitarian": ["Who bears the hidden cost?", "What are the 3-year externalities?", "Compare net flourishing"],
            "virtue": ["Where is the Golden Mean?", "Am I acting from timidity or courage?", "What habits will this build?"],
            "voi": ["Design a test for <$50", "What observable signal flips choice?", "How fast can I falsify this?"],
            "bias": ["Check for sunk cost fallacy", "Am I loss-averse?", "What is the empirical base rate?"]
        }
        return defaults.get(lens, defaults["socratic"])
