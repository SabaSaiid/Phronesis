# Requirements Specification — Phronesis

This document defines the functional requirements, data schemas, API specifications, and non-functional constraints for Phronesis.

---

## 1. Functional Requirements

### 1.1 Ingestion & Extraction Layer
- **FR-1.1 (Narrative Ingestion):** System shall accept unconstrained free-text input (min 20 characters, max 10,000 characters).
- **FR-1.2 (Structured Extraction):** System shall use LLM Structured Outputs / Tool-Calling (JSON schema enforcement) to parse narrative into the standard `StructuredDecision` schema.
- **FR-1.3 (Auto-Derivation of Utilities & Probabilities):** If probabilities are not explicitly stated, the extraction layer shall assign explicit prior estimates summing to 1.0 per state space, flagged as `inferred=true` for user confirmation.
- **FR-1.4 (User Verification & Editing):** System must provide an editable interface allowing users to adjust alternatives, states, probabilities, payoffs (0-100 scale), goals, constraints, and assumptions prior to downstream execution.

### 1.2 Cognitive Bias Engine (Layer 1 - Deterministic)
- **FR-2.1 (Pattern Knowledge Base):** The engine shall evaluate decisions against a versioned JSON knowledge base containing at minimum 5 core bias patterns:
  1. *Sunk Cost Salience*
  2. *Confirmation Bias / Evidence Asymmetry*
  3. *Loss Aversion / Asymmetric Downside Weighting*
  4. *Overconfidence / Planning Fallacy*
  5. *Status Quo Bias / Default Inertia*
- **FR-2.2 (Deterministic Matching Rules):** Bias pattern matching must execute via rule-based predicates (e.g., presence of historical time/money keywords, extreme probability deltas, asymmetric negative payoff weighting relative to explicit financial buffers).
- **FR-2.3 (Caveat Language Output):** Output must use non-diagnostic pattern language (`observed_trigger`, `caveat_analysis`, `reframing_prompt`).

### 1.3 Decision Theory & Math Engine (Layer 2 - Deterministic)
- **FR-3.1 (Expected Utility Calculation):** Compute Expected Utility ($EU$) for each alternative $a_i \in A$:
  $$EU(a_i) = \sum_{j=1}^{M} P(s_j) \cdot U(a_i, s_j)$$
- **FR-3.2 (Minimax Regret Computation):**
  1. Determine the maximum utility achieved across all alternatives for each state $s_j$:
     $$U^*(s_j) = \max_{k} U(a_k, s_j)$$
  2. Construct the regret matrix $R(a_i, s_j) = U^*(s_j) - U(a_i, s_j)$.
  3. Calculate maximum regret per alternative: $MR(a_i) = \max_{j} R(a_i, s_j)$.
  4. Identify the alternative minimizing maximum regret: $a^* = \arg\min_{i} MR(a_i)$.
- **FR-3.3 (Sensitivity Analysis & Inflection Derivation):**
  1. For the dominant alternative $a_1$ and runner-up $a_2$, solve for the probability threshold $p^*$ where $EU(a_1) = EU(a_2)$.
  2. Calculate the sensitivity gradient $\frac{\partial (EU(a_1) - EU(a_2))}{\partial U(a_i, s_j)}$ across all payoff cells.
  3. Flag the single most volatile parameter with the lowest relative delta required to flip the preferred option.

### 1.4 Philosophy Engine (Layer 3 - Deterministic)
- **FR-4.1 (Stoic Framework Matrix):** Map extracted goals, assumptions, and unknowns into the Stoic *Dichotomy of Control*:
  - **Internal (Controllable):** Personal effort, integrity, spending limits, boundaries, reaction protocols.
  - **External (Uncontrollable):** Market conditions, other people's actions, macro valuations, competitor moves.
- **FR-4.2 (Indifferents Categorization):** Categorize outcomes into *Virtue/Agency* vs. *Preferred Indifferents* (wealth, reputation, comfort) vs. *Dispreferred Indifferents* (temporary unemployment, discomfort).
- **FR-4.3 (Philosophical Inquiry Prompts):** Generate structured inquiry questions mapped to the user's highest-weight uncontrollables.

### 1.5 Critical Thinking Engine (Layer 4 - Hybrid)
- **FR-5.1 (Assumption Falsifiability Audit - Deterministic):** Grade each extracted assumption for testability based on verifiable empirical metrics vs. subjective value judgments.
- **FR-5.2 (Base-Rate Reality Check - Deterministic):** Compare user-estimated probabilities with known base-rate reference tables (e.g. startup survival rates, career transition timeframes).
- **FR-5.3 (Steelmanning & Counterargument - Targeted LLM Sub-call):** Generate the strongest coherent argument against the mathematically leading alternative to break confirmation bias.

### 1.6 Report Assembly Engine (VoI Synthesis)
- **FR-6.1 (Value-of-Information Framing):** Identify the parameter flagged in FR-3.3 and map it to the falsifiability audit in FR-5.1 to construct a cheap, concrete, real-world experiment.
- **FR-6.2 (Strict Tone Enforcement):** Assembly prompt must enforce absolute adherence to non-prescriptive, observational prose (verified by post-generation rule validator).

---

## 2. Core Data Schemas

### 2.1 Structured Decision JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "StructuredDecision",
  "type": "object",
  "required": [
    "decision_statement",
    "alternatives",
    "states_of_world",
    "payoff_matrix",
    "goals",
    "constraints",
    "assumptions"
  ],
  "properties": {
    "decision_statement": { "type": "string" },
    "alternatives": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "description"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    },
    "states_of_world": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "prior_probability"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "prior_probability": { "type": "number", "minimum": 0.0, "maximum": 1.0 }
        }
      }
    },
    "payoff_matrix": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["alternative_id", "state_id", "utility"],
        "properties": {
          "alternative_id": { "type": "string" },
          "state_id": { "type": "string" },
          "utility": { "type": "number", "minimum": 0, "maximum": 100 },
          "narrative": { "type": "string" }
        }
      }
    },
    "goals": { "type": "array", "items": { "type": "string" } },
    "constraints": { "type": "array", "items": { "type": "string" } },
    "assumptions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "text", "type", "testable"],
        "properties": {
          "id": { "type": "string" },
          "text": { "type": "string" },
          "type": { "type": "string", "enum": ["empirical", "value_attribution", "causal", "counterfactual"] },
          "testable": { "type": "boolean" }
        }
      }
    },
    "unknowns": { "type": "array", "items": { "type": "string" } }
  }
}
```

### 2.2 Knowledge Base Sourced Schemas (`bias_patterns.json` & `philosophy_frameworks.json`)

All knowledge base entries are **static, human-curated, git-versioned lookup tables**. Every entry must carry an explicit scientific/intellectual field and literature source. Knowledge base entries are never generated at runtime.

#### Bias Pattern Knowledge Base Schema (`bias_patterns.json`)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BiasPatternLookupTable",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["id", "name", "field", "source", "core_idea", "signals", "question_to_surface"],
    "properties": {
      "id": { "type": "string", "example": "sunk_cost" },
      "name": { "type": "string", "example": "Sunk Cost Salience" },
      "field": { "type": "string", "example": "behavioral_economics" },
      "source": { "type": "string", "example": "Kahneman & Tversky, Prospect Theory / Arkes & Blumer (1985)" },
      "core_idea": { "type": "string", "example": "Weighing a past, unrecoverable cost when deciding about the future." },
      "signals": {
        "type": "array",
        "items": { "type": "string" },
        "example": [
          "mentions time/money already invested",
          "reluctance framed around past effort rather than forward-looking expected utility"
        ]
      },
      "question_to_surface": {
        "type": "string",
        "example": "If you were starting today with no prior investment, would you still choose this option?"
      }
    }
  }
}
```

#### Philosophy Framework Knowledge Base Schema (`philosophy_frameworks.json`)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PhilosophyFrameworkLookupTable",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["id", "framework_name", "field", "source", "core_idea", "lens_questions"],
    "properties": {
      "id": { "type": "string", "example": "stoicism_v1" },
      "framework_name": { "type": "string", "example": "Stoic Decision Ethics (Epictetus / Marcus Aurelius)" },
      "field": { "type": "string", "example": "hellenistic_philosophy" },
      "source": { "type": "string", "example": "Epictetus, Enchiridion & Discourses; Hadot (The Inner Citadel)" },
      "core_idea": { "type": "string", "example": "Distinction between what is in our control (prohairesis) and what is not (indifferents)." },
      "lens_questions": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["dimension", "question", "target_signal"],
          "properties": {
            "dimension": { "type": "string", "example": "dichotomy_of_control" },
            "question": { "type": "string", "example": "Which elements of your decision represent external outcomes you cannot guarantee?" },
            "target_signal": { "type": "string", "example": "Heavy weighting placed on macro market conditions or third-party reactions." }
          }
        }
      }
    }
  }
}
```

### 2.3 Personalization & Decision-History Schema (Fast-Follow / Deferred)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UserDecisionRecord",
  "type": "object",
  "required": [
    "decision_id",
    "user_id",
    "timestamp",
    "structured_decision",
    "flagged_knowledge_entries",
    "computed_math_outputs"
  ],
  "properties": {
    "decision_id": { "type": "string" },
    "user_id": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "decision_statement": { "type": "string" },
    "structured_decision": { "$ref": "#/definitions/StructuredDecision" },
    "flagged_knowledge_entries": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["entry_id", "field", "source"],
        "properties": {
          "entry_id": { "type": "string" },
          "field": { "type": "string" },
          "source": { "type": "string" }
        }
      }
    },
    "computed_math_outputs": {
      "type": "object",
      "required": ["expected_utility", "minimax_regret", "critical_sensitivity_parameter"],
      "properties": {
        "expected_utility": { "type": "object" },
        "minimax_regret": { "type": "object" },
        "critical_sensitivity_parameter": { "type": "string" }
      }
    },
    "outcome_retrospective": {
      "type": "object",
      "properties": {
        "recorded_at": { "type": "string", "format": "date-time" },
        "chosen_alternative_id": { "type": "string" },
        "realized_outcome_notes": { "type": "string" }
      }
    }
  }
}
```

---

## 3. API Endpoint Specifications

All endpoints are hosted on the FastAPI backend (`http://localhost:8000/api/v1`).

### 3.1 Extraction Endpoints

#### `POST /api/v1/extract`
Extracts a structured decision object from raw text.
- **Request Body:**
  ```json
  {
    "narrative": "string (20 - 10000 chars)"
  }
  ```
- **Response Body (`200 OK`):**
  ```json
  {
    "status": "success",
    "structured_decision": { /* StructuredDecision Object */ },
    "extraction_confidence": 0.92
  }
  ```

### 3.2 Analysis Endpoints

#### `POST /api/v1/analyze/deterministic`
Executes mathematical solver, KB rubric matching, and critical-thinking audits on the confirmed structured object.
- **Request Body:**
  ```json
  {
    "structured_decision": { /* StructuredDecision Object */ }
  }
  ```
- **Response Body (`200 OK`):**
  ```json
  {
    "bias_layer": {
      "flagged_patterns": [
        {
          "entry_id": "sunk_cost",
          "field": "behavioral_economics",
          "source": "Kahneman & Tversky, Prospect Theory",
          "observed_trigger": "Reference to 5 years tenure and unvested RSUs",
          "question_to_surface": "If you were starting today with no prior investment, would you still choose this option?"
        }
      ]
    },
    "math_layer": {
      "expected_utility": { /* EU results */ },
      "minimax_regret": { /* Regret matrix & choice */ },
      "sensitivity_analysis": { /* Flipping thresholds */ }
    },
    "philosophy_layer": {
      "framework_id": "stoicism_v1",
      "field": "hellenistic_philosophy",
      "source": "Epictetus, Enchiridion",
      "dichotomy_of_control": { /* Controllables vs Uncontrollables */ },
      "surfaced_questions": [ /* Stoic Lens Questions */ ]
    },
    "critical_thinking_layer": { /* Falsifiability & Base Rates */ }
  }
  ```

#### `POST /api/v1/analyze/counterargument`
Executes the isolated generative steelmanning sub-call for the critical thinking layer.
- **Request Body:**
  ```json
  {
    "structured_decision": { /* StructuredDecision Object */ },
    "leading_alternative_id": "string"
  }
  ```
- **Response Body (`200 OK`):**
  ```json
  {
    "steelmanned_counterargument": "string"
  }
  ```

### 3.3 Synthesis Endpoints

#### `POST /api/v1/report/synthesize`
Generates the comprehensive markdown report with Value of Information framing and explicit source attribution.
- **Request Body:**
  ```json
  {
    "structured_decision": { /* StructuredDecision Object */ },
    "analysis_bundle": { /* Combined outputs of all 4 engines */ }
  }
  ```
- **Response Body (`200 OK`):**
  ```json
  {
    "report_markdown": "string",
    "key_sensitive_variable": "string",
    "proposed_experiment": "string",
    "attributed_sources": [
      { "field": "behavioral_economics", "source": "Kahneman & Tversky (1979)" },
      { "field": "hellenistic_philosophy", "source": "Epictetus, Enchiridion" }
    ]
  }
  ```

### 3.4 Benchmark / Demo Endpoints

#### `GET /api/v1/benchmarks`
Returns pre-packaged benchmark decisions for instant zero-key testing.
- **Response Body (`200 OK`):**
  ```json
  {
    "benchmarks": [
      {
        "id": "tech_career_pivot",
        "title": "Enterprise Staff Engineer vs. Pre-Seed Founding Engineer",
        "narrative": "...",
        "pre_extracted": { /* StructuredDecision */ }
      }
    ]
  }
  ```

---

## 4. Non-Functional Requirements

### 4.1 Auditability, Sourcing & Determinism
- **Traceable Attribution:** Every flagged bias or philosophical inquiry surfaced in the final report must include its explicit scientific/philosophical `field` and literature `source` (e.g., *"Source: Behavioral Economics — Loss Aversion (Kahneman & Tversky)"*). The system must never present findings as *"the AI concluded this"*.
- **Pure Math Determinism:** All mathematical evaluations in `app/engines/math_engine.py` are pure functions with $100\%$ reproducible outputs given identical JSON inputs. No random seeds or stochastic simulations in the math engine.
- **Auditable Formulations:** Every calculated inflection threshold must include the underlying algebraic formulation in the response object for client-side auditing.

### 4.2 Strict Traceability of Report Content
- **Sentence-Level Grounding:** Every single sentence in the generated report must be strictly traceable to a field or value produced by one of the four analysis layers or the confirmed `StructuredDecision`.
- **Zero Hallucinated Claims:** The report writer is forbidden from introducing outside facts, personal advice, or ungrounded conclusions. If a claim does not trace back to an engine's output, the synthesis prompt is considered defective.

### 4.3 Strict Caveat-Language & Non-Negotiable Boundary Enforcement
- **Two-Stage Defense Pipeline:** The backend shall enforce non-negotiable boundaries using a two-stage post-generation validation pipeline:
  1. **Stage 1 (Regex / Lexicon Linter):** Fast first-pass filtering catching explicit prescriptive phrasing (*"you should choose"*, *"it would be prudent to"*, *"the wiser path"*, *"clearly comes out ahead"*, *"we advise/recommend"*), diagnostic labels (*"textbook case of"*, *"classic X pattern"*, *"you suffer from"*), and arbitrary composite scores.
  2. **Stage 2 (Constrained LLM Boundary Audit):** A secondary constrained LLM classifier auditing generated report text strictly against the 5 Non-Negotiable Boundaries (`never diagnose`, `never prescribe`, `never score`, `never privilege single school`, `never assert certainty`), returning a binary pass/fail and the offending sentence.
- **Fail-Safe Fallback:** Any output failing either Stage 1 or Stage 2 shall fail safe to a 100% deterministic structured template rendering the raw analytical layer summaries directly, preventing ungrounded or non-compliant text from ever reaching the user.

### 4.4 Latency & Performance
- Deterministic analysis execution time: $<50\text{ ms}$ for standard $3\times 3$ matrices.
- Extraction & Synthesis LLM calls: streamed or completed within $<8\text{ s}$ under standard API load.

### 4.5 Model Independence & No Training
- System operates exclusively over standard commercial API endpoints (OpenAI, Anthropic Claude, Google Gemini) using structured tool-calling.
- Zero proprietary model fine-tuning or training required. All domain knowledge resides in versioned, human-reviewed JSON files.
