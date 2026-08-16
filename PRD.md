# Product Requirements Document (PRD) — Phronesis

## 1. Executive Summary

**Phronesis** (*φρόνησις* — practical wisdom) is an interactive decision-reasoning engine designed to structure, stress-test, and clarify complex human decisions.

Traditional decision aids either oversimplify complex personal dilemmas into arbitrary scoring matrices (*"Pros vs. Cons"*) or abdicate human agency to black-box LLMs that hallucinate moral and strategic recommendations. Phronesis solves this by introducing a **hybrid, auditable cognitive pipeline**: natural language understanding is handled by LLMs, but all analysis — mathematical sensitivity, cognitive bias pattern matching, critical thinking audits, and philosophical tension mapping — is computed deterministically by verifiable, auditable code.

---

## 2. Problem Statement & Target User

### 2.1 The Problem
High-stakes human decision-making is routinely corrupted by three structural vulnerabilities:
1. **Implicit Assumptions & Cognitive Blinds:** Decision-makers conflate what is probable with what is desirable, fall prey to status-quo inertia, or overweight sunk costs.
2. **Fragile Intuitions vs. Mathematical Sensitivity:** People struggle to identify which single variable or assumption would flip their preferred alternative if wrong.
3. **Premature Convergence & Advice Dependency:** Seeking AI or external advice often results in premature recommendations ("You should do X") that mask the underlying risk trade-offs and rob the human of ownership.

### 2.2 Target Users
- **Strategic Operators & Founders:** Evaluating pivots, resource allocation, and career transitions under deep uncertainty.
- **Engineers & Technical Leaders:** Weighing architectural tradeoffs, build vs. buy decisions, and organizational changes.
- **Reflective Individuals:** People navigating complex personal crossroads (relocation, career shifts, major financial commitments) who value structured clarity over prescriptive answers.

---

## 3. Core Principles & Guardrails

### 3.1 Non-Negotiable System Axioms
1. **Judgment is Never Outsourced:** The LLM translates human narrative to structured data and converts analytical findings to prose. It never computes probabilities, determines moral frameworks, or tells the user what choice to make.
2. **Human-in-the-Loop Confirmation:** Downstream analysis *never* runs directly on raw unverified LLM extractions. The user retains absolute veto and editing rights over the structured decision model.
3. **Caveat-Driven, Observational Language:** Phronesis uses pattern-detection nomenclature (*"This reasoning reflects structural characteristics of sunk cost weighting"*), never diagnostic labeling (*"You are suffering from the sunk cost fallacy"*).
4. **Value of Information (VoI) over Prescriptive Verdicts:** The terminal output is not a verdict; it is an identification of the single most decision-sensitive assumption and a proposal for the cheapest real-world experiment to test it.
5. **No Single Scalar Scores:** Phronesis will never reduce multidimensional human dilemmas to an aggregate index (e.g., *"Option A scores 84/100"*).

---

## 4. Product Scope

### 4.1 V1 Scope (In-Scope)
- **Free-Text Input:** Unconstrained narrative entry with real-time token and validation checks.
- **LLM Structured Extraction:** Extraction of Options, States of the World, Outcomes, Probabilities, Utilities/Payoffs, Constraints, Assumptions, and Unknowns via strict JSON schema.
- **Interactive Extraction Review UI:** A clear UI allowing users to add, edit, or delete extracted alternatives, probabilities, and assumptions before running engines.
- **Four Core Analysis Engines:**
  1. *Cognitive Bias Engine (Deterministic):* 5 core patterns (Sunk Cost, Confirmation Bias, Loss Aversion, Overconfidence / Planning Fallacy, Status Quo Bias).
  2. *Decision Theory Engine (Deterministic):* Expected Utility (EU), Minimax Regret Matrix, and Sensitivity Analysis (identifying inflection/flipping thresholds).
  3. *Philosophy Engine (Deterministic):* Stoic Framework (Dichotomy of Control categorization, Preferred vs. Dispreferred Indifferents).
  4. *Critical Thinking Engine (Hybrid):* Deterministic assumption falsifiability grading + Base-rate inquiry + Targeted generative steelmanning/counterargument generation.
- **Value-of-Information (VoI) Report Synthesis:** Second LLM pass converting engine outputs into a clean, markdown report emphasizing cheap next steps.
- **Zero-Key Interactive Benchmark:** Pre-loaded real-world decision cases for instant evaluation without requiring API credentials.

### 4.2 Out-of-Scope (Fast-Follow & V2 Roadmap)
- Comprehensive 20+ bias catalog (anchoring, availability heuristic, framing effect, clustering illusion).
- Additional philosophical modules (Utilitarianism / Benthamite Calculus, Kantian Deontology, Aristotelian Virtue Ethics, Existentialism).
- User authentication, multi-tenant databases, and persistent user profiles.
- Longitudinal decision tracking, calibration journals, and outcome-logging retro tools.
- Continuous probability distributions, Monte Carlo simulations, and multi-stage decision trees.

---

## 5. End-to-End Worked Example

To ground the system requirements, the following represents the exact lifecycle of a decision in Phronesis.

### Step 1: Raw User Input (Free-Text Narrative)
```text
I am currently a Staff Software Engineer at an established enterprise tech company making $280k/year.
The job is comfortable, 35 hrs/week, but deeply uninspiring and I feel my skills are stagnating.
I have been offered the Founding Engineer role at a pre-seed AI startup with a $140k salary plus 2.5% equity.
They have 14 months of runway ($1.2M seed).
My spouse works and earns $90k, and we have $80k in liquid emergency savings.
I feel like if I don't join now, I'll regret watching this AI wave pass by.
However, I've spent 5 years building reputation and vesting RSUs here, with another $120k vesting over the next 18 months.
If the startup fails within a year, I worry I won't easily find another high-paying staff role in this market.
```

---

### Step 2: Extracted Structured Decision Model (JSON)
*(Presented to the user for editing and confirmation)*

```json
{
  "decision_statement": "Choose whether to remain in current enterprise Staff Engineer role or join pre-seed AI startup as Founding Engineer.",
  "alternatives": [
    {
      "id": "alt_1",
      "name": "Stay at Enterprise",
      "description": "Maintain Staff Engineer role with $280k total comp and 35hr work week."
    },
    {
      "id": "alt_2",
      "name": "Join AI Startup",
      "description": "Accept Founding Engineer position with $140k salary + 2.5% equity with 14mo runway."
    }
  ],
  "states_of_world": [
    {
      "id": "state_startup_wins",
      "name": "Startup succeeds / reaches Series A",
      "prior_probability": 0.30
    },
    {
      "id": "state_startup_fails",
      "name": "Startup shuts down or stalls within 18 months",
      "prior_probability": 0.70
    }
  ],
  "payoff_matrix": [
    {
      "alternative_id": "alt_1",
      "state_id": "state_startup_wins",
      "utility": 50,
      "narrative": "Financial stability, high regret over missed startup upside and skill stagnation."
    },
    {
      "alternative_id": "alt_1",
      "state_id": "state_startup_fails",
      "utility": 70,
      "narrative": "Financial security, relief at avoiding failed venture, continued stagnation."
    },
    {
      "alternative_id": "alt_2",
      "state_id": "state_startup_wins",
      "utility": 95,
      "narrative": "High financial upside, career acceleration, steep learning curve."
    },
    {
      "alternative_id": "alt_2",
      "state_id": "state_startup_fails",
      "utility": 30,
      "narrative": "Income drop, loss of unvested equity, need to re-enter job market."
    }
  ],
  "goals": [
    "Maximize long-term career growth & AI technical mastery",
    "Preserve household financial baseline"
  ],
  "constraints": [
    "Household living costs require minimum $120k combined income",
    "Emergency fund of $80k provides 8 months buffer if unemployed"
  ],
  "assumptions": [
    {
      "id": "assump_1",
      "text": "Finding another Staff Engineer job in 14-18 months will be difficult if the startup fails.",
      "type": "empirical",
      "testable": true
    },
    {
      "id": "assump_2",
      "text": "The 5 years spent and $120k unvested RSUs represent lost value if abandoned.",
      "type": "value_attribution",
      "testable": false
    },
    {
      "id": "assump_3",
      "text": "Remaining at current job guarantees skill stagnation during the current AI cycle.",
      "type": "causal",
      "testable": true
    }
  ],
  "unknowns": [
    "True probability of startup securing follow-on Series A in current climate",
    "Actual time and compensation distribution for re-hiring at Staff level in 2026/2027"
  ]
}
```

---

### Step 3: Raw Outputs of the 4 Deterministic Engines

#### Layer 1: Cognitive Bias Engine Output
```json
{
  "flagged_patterns": [
    {
      "id": "sunk_cost",
      "field": "behavioral_economics",
      "source": "Kahneman & Tversky, Prospect Theory / Arkes & Blumer (1985)",
      "core_idea": "Weighing a past, unrecoverable cost when deciding about the future.",
      "observed_trigger": "Reference to '5 years building reputation and vesting RSUs' as a reason to hesitate.",
      "caveat_analysis": "The reasoning incorporates past investments (5 years of tenure and unvested stock) into the forward-looking evaluation. Economically, past tenure cannot be recovered regardless of the choice.",
      "question_to_surface": "If you were starting today with no prior investment, would you still choose this option?"
    },
    {
      "id": "loss_aversion",
      "field": "behavioral_economics",
      "source": "Tversky & Kahneman (1991), Loss Aversion in Riskless Choice",
      "core_idea": "Losses loom larger than corresponding gains in subjective valuation.",
      "observed_trigger": "Downside utility of startup failure (30) heavily penalizes potential career difficulty despite 8-month cash buffer.",
      "caveat_analysis": "The subjective penalty assigned to the failure scenario appears disproportional to the explicit financial constraints (household minimum is $120k and spouse earns $90k, plus $80k savings).",
      "question_to_surface": "Is the anxiety of searching for a job driving the score, or is there an existential financial vulnerability not captured in the constraints?"
    }
  ]
}
```

#### Layer 2: Decision Theory & Math Engine Output
```json
{
  "expected_utility": {
    "alt_1_stay": 64.0,
    "alt_2_startup": 49.5,
    "preferred_under_prior": "alt_1_stay"
  },
  "minimax_regret": {
    "regret_matrix": {
      "state_startup_wins": { "alt_1_stay": 45.0, "alt_2_startup": 0.0 },
      "state_startup_fails": { "alt_1_stay": 0.0, "alt_2_startup": 40.0 }
    },
    "maximum_regrets": {
      "alt_1_stay": 45.0,
      "alt_2_startup": 40.0
    },
    "minimax_regret_choice": "alt_2_startup",
    "regret_tradeoff_insight": "Under Expected Utility, staying dominates because failure probability is 70%. However, under Minimax Regret, joining the startup minimizes worst-case psychological regret (40.0 vs 45.0 missed upside)."
  },
  "sensitivity_analysis": {
    "critical_parameter": "prior_probability(state_startup_wins)",
    "current_value": 0.30,
    "inflection_threshold": 0.523,
    "directional_shift": "If the probability of startup success exceeds 52.3%, joining the startup becomes the higher expected-utility alternative.",
    "utility_sensitivity": [
      {
        "parameter": "utility(alt_2_startup, state_startup_fails)",
        "current_value": 30,
        "inflection_threshold": 50.7,
        "insight": "If the downside of startup failure is mitigated (e.g. knowing you can land a Senior/Staff role in 60 days), the threshold drops significantly."
      }
    ]
  }
}
```

#### Layer 3: Philosophy Engine Output (Stoic Lens)
```json
{
  "framework_id": "stoicism_v1",
  "field": "hellenistic_philosophy",
  "source": "Epictetus, Enchiridion & Discourses; Hadot (The Inner Citadel)",
  "core_idea": "Distinction between what is in our control (prohairesis) and what is not (indifferents).",
  "dichotomy_of_control": {
    "internal_controllables": [
      "Dedication to skill acquisition and technical mastery",
      "Strict maintenance of personal savings and monthly burn rate",
      "Quality of daily execution and leadership at either organization"
    ],
    "external_uncontrollables": [
      "Macro venture capital fundraising climate for Series A",
      "Enterprise company leadership shifts and RSU stock price fluctuation",
      "Macro hiring appetite for Staff Engineers 18 months from now"
    ]
  },
  "indifferents_analysis": {
    "preferred_indifferents": ["$280k compensation", "Prestige of founding engineer title", "14mo runway"],
    "virtue_alignment": "Stoic ethics posits that career status and monetary compensation are preferred indifferents. The core good is personal agency and excellence of character. If skill stagnation erodes agency, staying for unvested equity prioritizes an indifferent over virtue."
  },
  "surfaced_questions": [
    "Are you anchoring your decision on controlling an external outcome (guaranteeing the startup succeeds or market stays hot) rather than your internal discipline (handling whatever outcome unfolds)?"
  ]
}
```

#### Layer 4: Critical Thinking Engine Output
```json
{
  "falsifiability_audit": [
    {
      "assumption": "Finding another Staff Engineer job in 14-18 months will be difficult if the startup fails.",
      "falsifiability_grade": "High",
      "test_method": "Inspect active outbound recruiter outreach and conduct 2 discreet informational conversations with peer hiring managers."
    },
    {
      "assumption": "Remaining at current job guarantees skill stagnation.",
      "falsifiability_grade": "Medium",
      "test_method": "Determine if self-directed open-source AI projects or internal team transfers could mitigate stagnation without leaving."
    }
  ],
  "base_rate_check": {
    "reference_class": "Pre-seed AI startups raising Series A in 2025-2026",
    "empirical_base_rate": "Approximately 18% to 25% of pre-seed startups successfully raise a priced Series A within 18 months.",
    "user_assumption": "30% success probability",
    "divergence_flag": "User's estimated probability (30%) is moderately more optimistic than the historic market base rate (20%). If calculated at 20%, EU for joining drops from 49.5 to 43.0."
  },
  "steelmanned_counterargument": "The optimal path might be neither stagnation nor a high-risk 14-month seed venture. By treating this as a binary choice between current inertia and a high-risk startup, you may be ignoring a third alternative: actively interviewing for well-funded Series B/C scale-ups where you gain immediate AI exposure with 3+ years of runway."
}
```

---

### Step 4: Final Value-of-Information (VoI) Synthesis Report
*(Generated by Report Synthesis LLM using strict slot-filling and caveat instructions)*

```markdown
# Decision Reasoning Audit: Enterprise Staff Role vs. Pre-Seed Startup

## Executive Summary of Reasoning Dynamics
Your decision hinges on a fundamental tension between **expected financial yield** and **minimax regret mitigation**. Under pure probabilistic expectations (given an estimated 70% startup failure rate), remaining in your enterprise role generates higher expected utility ($64.0$ vs. $49.5$). However, under minimax regret, joining the startup dominates ($40.0$ max regret vs. $45.0$), revealing that the anticipated psychological cost of watching the AI cycle pass by is your primary internal driver.

---

## 1. Mathematical Sensitivity & Inflection Thresholds
- **Startup Success Sensitivity:** Joining the startup becomes mathematically optimal under your utility preferences only if the true probability of startup success exceeds **$52.3\%$** (current estimate: $30\%$; venture base rate: $\approx 20\%$).
- **Downside Failure Floor:** Alternatively, if the subjective pain of startup failure increases from your current score of $30$ to $51$ (by de-risking re-employment), the startup option immediately reaches parity with staying.

---

## 2. Sourced Cognitive & Philosophical Tradeoffs
- **Sunk Cost Salience** *(Source: Behavioral Economics — Kahneman & Tversky; Arkes & Blumer)*:  
  Your reasoning actively incorporates past tenure and unvested RSUs ($120k). While emotionally salient, past allocations cannot be recovered regardless of the forward choice.  
  *Inquiry:* If you were arriving in the market today with zero tenure at this company, would you choose the enterprise role or the startup?
- **Stoic Dichotomy of Control** *(Source: Hellenistic Philosophy — Epictetus, Enchiridion)*:  
  You are placing high cognitive weight on macroeconomic hiring conditions in 18 months (an uncontrollable external) while under-utilizing your liquid safety buffer ($80k emergency savings + partner's $90k salary, providing an 8-month financial buffer against controllable burn).

---

## 3. High-Leverage Value of Information (VoI) Experiments

Instead of committing immediately, the analysis demonstrates that your decision is hyper-sensitive to **one falsifiable assumption**: *How difficult will it be to re-enter the job market if the startup fails?*

### 🧪 Proposed Low-Cost Experiments:
1. **The Ghost Market Test ($0 Cost, 48-Hour Turnaround):**
   Update your resume and send 3 discreet inquiries or speak with 2 external recruiters to gauge immediate demand and typical time-to-hire for Staff roles in your specialization. If time-to-hire is $<60$ days, your downside failure utility increases significantly, collapsing the risk delta.
2. **The Internal AI Allocation Pitch ($0 Cost, 1 Week):**
   Pitch a dedicated 20% internal AI initiative or team transfer at your current employer. If accepted, you eliminate the stagnation penalty without absorbing seed-stage financing risk.
```

---

## 6. Success Metrics for V1

1. **Extraction Accuracy & User Edit Rate:** $>80\%$ of extracted entities require zero or minor user corrections.
2. **Deterministic Integrity:** $100\%$ of mathematical outputs and bias matches are reproduced consistently without variation across identical input objects.
3. **Absence of Prescriptive Leakage:** Zero instances of prescriptive imperative commands (*"You should choose X"*) in generated synthesis reports.
4. **Time to Structured Clarity:** Users transition from raw narrative input to completed, actionable VoI report in $<60$ seconds.
