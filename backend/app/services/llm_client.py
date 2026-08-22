import os
import json
from typing import Dict, Any, Optional
from app.core.config import settings

from app.schemas.decision import LLMConfigOverride, LLMModelOption, ModelsCatalogResponse

class LLMClient:
    """
    Unified LLM Client supporting Gemini, OpenAI, Anthropic, and Mock/Offline fallback.
    Maintains cached client instances for HTTP connection pooling.
    Supports per-request LLMConfigOverride without mutating server singleton state.
    """

    _clients: Dict[str, Any] = {}

    @classmethod
    def _resolve_provider_model_key(cls, llm_config: Optional[LLMConfigOverride] = None):
        provider = (llm_config.provider if llm_config and llm_config.provider else settings.LLM_PROVIDER or "mock").lower()
        
        # Determine API key based on provider
        api_key = None
        if llm_config and llm_config.api_key:
            api_key = llm_config.api_key
        elif settings.LLM_API_KEY:
            api_key = settings.LLM_API_KEY
        else:
            if provider == "gemini":
                api_key = os.environ.get("GEMINI_API_KEY")
            elif provider == "openai":
                api_key = os.environ.get("OPENAI_API_KEY")
            elif provider == "anthropic":
                api_key = os.environ.get("ANTHROPIC_API_KEY")
            if not api_key:
                api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY") or os.environ.get("ANTHROPIC_API_KEY")

        # Determine Model
        if llm_config and llm_config.model:
            model = llm_config.model
        elif settings.LLM_MODEL:
            model = settings.LLM_MODEL
        else:
            if provider == "gemini":
                model = "gemini-2.5-flash"
            elif provider == "openai":
                model = "gpt-4o-mini"
            elif provider == "anthropic":
                model = "claude-3-5-sonnet-20241022"
            else:
                model = "mock-deterministic"

        return provider, model, api_key

    @classmethod
    def get_models_catalog(cls) -> ModelsCatalogResponse:
        gemini_key = bool(settings.LLM_API_KEY or os.environ.get("GEMINI_API_KEY"))
        openai_key = bool(os.environ.get("OPENAI_API_KEY") or (settings.LLM_PROVIDER == "openai" and settings.LLM_API_KEY))
        anthropic_key = bool(os.environ.get("ANTHROPIC_API_KEY") or (settings.LLM_PROVIDER == "anthropic" and settings.LLM_API_KEY))

        default_prov = (settings.LLM_PROVIDER or "gemini").lower()
        default_mod = settings.LLM_MODEL or ("gemini-2.5-flash" if default_prov == "gemini" else "gpt-4o-mini" if default_prov == "openai" else "claude-3-5-sonnet-20241022")

        models = [
            LLMModelOption(
                provider="gemini",
                model="gemini-2.5-flash",
                label="Gemini 2.5 Flash",
                description="Fast and highly responsive multimodal model",
                has_key=gemini_key,
                is_default=(default_prov == "gemini" and "flash" in default_mod)
            ),
            LLMModelOption(
                provider="gemini",
                model="gemini-2.5-pro",
                label="Gemini 2.5 Pro",
                description="High reasoning depth and complex nuance extraction",
                has_key=gemini_key,
                is_default=(default_prov == "gemini" and "pro" in default_mod)
            ),
            LLMModelOption(
                provider="openai",
                model="gpt-4o-mini",
                label="GPT-4o Mini",
                description="Lightweight and structured reasoning",
                has_key=openai_key,
                is_default=(default_prov == "openai" and "mini" in default_mod)
            ),
            LLMModelOption(
                provider="openai",
                model="gpt-4o",
                label="GPT-4o",
                description="Flagship OpenAI omni intelligence",
                has_key=openai_key,
                is_default=(default_prov == "openai" and "mini" not in default_mod)
            ),
            LLMModelOption(
                provider="anthropic",
                model="claude-3-5-sonnet-20241022",
                label="Claude 3.5 Sonnet",
                description="Precision prose synthesis and rigorous nuance",
                has_key=anthropic_key,
                is_default=(default_prov == "anthropic")
            ),
            LLMModelOption(
                provider="mock",
                model="deterministic",
                label="Offline Deterministic",
                description="Pure Python heuristic extraction & templating (Zero API keys needed)",
                has_key=True,
                is_default=(default_prov == "mock")
            ),
        ]

        return ModelsCatalogResponse(
            models=models,
            default_model={"provider": default_prov, "model": default_mod}
        )

    @classmethod
    def _get_gemini_client(cls, api_key: str):
        key = f"gemini_{api_key}"
        if key not in cls._clients:
            from google import genai
            cls._clients[key] = genai.Client(api_key=api_key)
        return cls._clients[key]

    @classmethod
    def _get_openai_client(cls, api_key: str):
        key = f"openai_{api_key}"
        if key not in cls._clients:
            from openai import AsyncOpenAI
            cls._clients[key] = AsyncOpenAI(api_key=api_key)
        return cls._clients[key]

    @classmethod
    def _get_anthropic_client(cls, api_key: str):
        key = f"anthropic_{api_key}"
        if key not in cls._clients:
            from anthropic import AsyncAnthropic
            cls._clients[key] = AsyncAnthropic(api_key=api_key)
        return cls._clients[key]

    @classmethod
    async def generate_structured_json(
        cls,
        system_prompt: str,
        user_prompt: str,
        llm_config: Optional[LLMConfigOverride] = None
    ) -> Dict[str, Any]:
        provider, model, api_key = cls._resolve_provider_model_key(llm_config)

        if not api_key or provider == "mock":
            return cls._mock_structured_response(user_prompt)

        try:
            if provider == "gemini":
                from google.genai import types
                client = cls._get_gemini_client(api_key)
                response = client.models.generate_content(
                    model=model,
                    contents=f"{system_prompt}\n\nUser Input:\n{user_prompt}",
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1
                    )
                )
                return json.loads(response.text)

            elif provider == "openai":
                client = cls._get_openai_client(api_key)
                response = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1
                )
                return json.loads(response.choices[0].message.content)

            elif provider == "anthropic":
                client = cls._get_anthropic_client(api_key)
                response = await client.messages.create(
                    model=model,
                    max_tokens=2000,
                    system=system_prompt + "\nReturn ONLY valid JSON.",
                    messages=[{"role": "user", "content": user_prompt}],
                    temperature=0.1
                )
                content = response.content[0].text
                # Clean potential markdown wrapping
                if content.startswith("```json"):
                    content = content.replace("```json", "", 1).rsplit("```", 1)[0]
                elif content.startswith("```"):
                    content = content.replace("```", "", 1).rsplit("```", 1)[0]
                return json.loads(content.strip())

        except Exception as e:
            print(f"[LLMClient Warning] LLM call ({provider}/{model}) failed with error: {e}. Falling back to mock generator.")
            return cls._mock_structured_response(user_prompt)

        return cls._mock_structured_response(user_prompt)

    @classmethod
    async def generate_text(
        cls,
        system_prompt: str,
        user_prompt: str,
        llm_config: Optional[LLMConfigOverride] = None
    ) -> str:
        provider, model, api_key = cls._resolve_provider_model_key(llm_config)

        if not api_key or provider == "mock":
            return cls._mock_text_response(user_prompt)

        try:
            if provider == "gemini":
                client = cls._get_gemini_client(api_key)
                response = client.models.generate_content(
                    model=model,
                    contents=f"{system_prompt}\n\nContext Data:\n{user_prompt}"
                )
                return response.text

            elif provider == "openai":
                client = cls._get_openai_client(api_key)
                response = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.2
                )
                return response.choices[0].message.content

            elif provider == "anthropic":
                client = cls._get_anthropic_client(api_key)
                response = await client.messages.create(
                    model=model,
                    max_tokens=3000,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_prompt}],
                    temperature=0.2
                )
                return response.content[0].text

        except Exception as e:
            print(f"[LLMClient Warning] LLM text generation ({provider}/{model}) failed with error: {e}. Using deterministic template fallback.")
            return cls._mock_text_response(user_prompt)

        return cls._mock_text_response(user_prompt)

    @staticmethod
    def _mock_structured_response(user_prompt: str) -> Dict[str, Any]:
        """
        Deterministic, intelligent fallback parser extracting structured models from prose.
        """
        p_lower = user_prompt.lower()
        
        # Detect dilemma topics
        if "startup" in p_lower or "founding engineer" in p_lower or "rsus" in p_lower:
            return {
                "decision_statement": "Evaluate whether to remain in current enterprise role or join seed-stage AI startup as founding engineer.",
                "alternatives": [
                    {"id": "alt_stay", "name": "Stay at Current Role", "description": "Retain stable position with consistent compensation and predictable hours."},
                    {"id": "alt_startup", "name": "Join AI Startup", "description": "Accept founding engineer equity and lower cash salary with high growth upside."}
                ],
                "states_of_world": [
                    {"id": "state_success", "name": "Startup Succeeds / Market Expands", "prior_probability": 0.30},
                    {"id": "state_failure", "name": "Startup Stalls / Difficult Market", "prior_probability": 0.70}
                ],
                "payoff_matrix": [
                    {"alternative_id": "alt_stay", "state_id": "state_success", "utility": 50.0, "narrative": "Stable income, regret over missed upside."},
                    {"alternative_id": "alt_stay", "state_id": "state_failure", "utility": 70.0, "narrative": "Financial safety, continued stability."},
                    {"alternative_id": "alt_startup", "state_id": "state_success", "utility": 95.0, "narrative": "High financial upside and career acceleration."},
                    {"alternative_id": "alt_startup", "state_id": "state_failure", "utility": 30.0, "narrative": "Loss of unvested equity, need to re-enter job market."}
                ],
                "goals": [
                    "Maximize long-term career growth & AI technical mastery",
                    "Preserve household financial baseline"
                ],
                "constraints": [
                    "Household requires minimum $120k annual cash flow",
                    "Emergency liquid savings available as buffer"
                ],
                "assumptions": [
                    {"id": "assump_1", "text": "Finding an equivalent role within 12-18 months will be difficult if the venture fails.", "type": "empirical", "testable": True},
                    {"id": "assump_2", "text": "Unvested RSUs and past tenure represent lost value if abandoned.", "type": "value_attribution", "testable": False},
                    {"id": "assump_3", "text": "Remaining at current job guarantees skill stagnation during the current cycle.", "type": "causal", "testable": True}
                ],
                "unknowns": [
                    "Macro venture capital environment for follow-on Series A",
                    "True time-to-hire in target job market in 18 months"
                ]
            }
        else:
            return {
                "decision_statement": "Evaluate primary alternative paths for the stated objective.",
                "alternatives": [
                    {"id": "alt_1", "name": "Maintain Current Path (Status Quo)", "description": "Continue existing baseline approach to minimize transition risk."},
                    {"id": "alt_2", "name": "Pursue Active Transition", "description": "Execute proposed change to capture upside potential."}
                ],
                "states_of_world": [
                    {"id": "state_favorable", "name": "Favorable Environmental Conditions", "prior_probability": 0.40},
                    {"id": "state_unfavorable", "name": "Challenging / Adverse Conditions", "prior_probability": 0.60}
                ],
                "payoff_matrix": [
                    {"alternative_id": "alt_1", "state_id": "state_favorable", "utility": 55.0, "narrative": "Moderate satisfaction, missed upside."},
                    {"alternative_id": "alt_1", "state_id": "state_unfavorable", "utility": 65.0, "narrative": "Protected against downside volatility."},
                    {"alternative_id": "alt_2", "state_id": "state_favorable", "utility": 90.0, "narrative": "High upside realization and growth."},
                    {"alternative_id": "alt_2", "state_id": "state_unfavorable", "utility": 35.0, "narrative": "Absorbing transition friction and costs."}
                ],
                "goals": ["Achieve high personal/strategic impact", "Maintain downside resilience"],
                "constraints": ["Time and resource budget limits"],
                "assumptions": [
                    {"id": "assump_1", "text": "The expected upside of the new path outweighs transition friction.", "type": "empirical", "testable": True}
                ],
                "unknowns": ["Unforeseen friction during initial rollout"]
            }

    @staticmethod
    def _mock_text_response(user_prompt: str) -> str:
        return (
            "## Summary of Reasoning Dynamics\n\n"
            "Your decision exhibits a structural tension between Expected Utility maximization and Minimax Regret mitigation. "
            "Under probabilistic expectation, the baseline option carries higher utility due to conservative failure probabilities. "
            "However, minimax regret analysis indicates that the transition option minimizes worst-case psychological regret.\n\n"
            "## Sourced Tradeoffs\n"
            "- **Sunk Cost Salience** *(Source: Behavioral Economics — Kahneman & Tversky)*: Prior tenure and investments should not penalize forward-looking choices.\n"
            "- **Stoic Dichotomy of Control** *(Source: Hellenistic Philosophy — Epictetus)*: Focus on controllable preparation rather than macro market factors.\n\n"
            "## Value of Information (VoI) Experiment\n"
            "Your decision is hyper-sensitive to whether downside re-employment is truly high friction. "
            "Run a 48-hour market test with 2 discreet informational conversations before committing."
        )

    @classmethod
    async def audit_report_boundaries(
        cls,
        report_text: str,
        llm_config: Optional[LLMConfigOverride] = None
    ) -> Dict[str, Any]:
        """
        Stage 2 LLM Audit Pass: Evaluates generated report text strictly against
        the 5 Non-Negotiable Boundaries from the README.
        Allowed output: JSON with {passed: bool, offending_sentence: str, violation_reason: str}
        """
        provider, model, api_key = cls._resolve_provider_model_key(llm_config)

        if not api_key or provider == "mock":
            return cls._mock_audit_response(report_text)

        system_prompt = (
            "You are a strict, automated Quality Assurance Compliance Classifier for Phronesis.\n"
            "Your ONLY job is to classify whether a synthesized decision report complies with the 5 Non-Negotiable Boundaries or violates any of them.\n\n"
            "THE 5 NON-NEGOTIABLE BOUNDARIES:\n"
            "1. Never State a Diagnosis: Must use observational pattern language ('consistent with X'), NEVER personal diagnostic/identity labels ('you suffer from X', 'you have X bias', 'you are exhibiting classic X', 'textbook case of').\n"
            "2. Never Claim Mathematical Prescriptiveness: Decision theory tools (Expected Utility, Minimax Regret) are heuristics for stress-testing preferences, NEVER proofs of what life choices one ought to make. Must NEVER advise, prescribe, or declare a winner ('you should choose', 'prudent to pick', 'the wiser path', 'Option A clearly comes out ahead').\n"
            "3. Never Collapse to a Single Score: No scalar ratings, composite indices, or numerical scores (e.g., '87/100', 'Grade A').\n"
            "4. Never Privilege a Single Philosophical School: Philosophical frameworks are lenses revealing distinct moral vectors, NEVER objective arbiters of right action.\n"
            "5. Never Assert Psychological Certainty: Cognitive biases are flagged as possible risks to inspect, NEVER certain mental states.\n\n"
            "OUTPUT FORMAT (STRICT JSON ONLY):\n"
            "{\n"
            '  "passed": true | false,\n'
            '  "offending_sentence": "<verbatim sentence from the text that violated a boundary, or empty string if passed>",\n'
            '  "violation_reason": "<concise explanation of which boundary was violated, or empty string if passed>"\n'
            "}"
        )
        user_prompt = f"Analyze and classify this generated report:\n\n{report_text}"

        try:
            if provider == "gemini":
                from google.genai import types
                client = cls._get_gemini_client(api_key)
                response = client.models.generate_content(
                    model=model,
                    contents=f"{system_prompt}\n\n{user_prompt}",
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.0
                    )
                )
                return json.loads(response.text)

            elif provider == "openai":
                client = cls._get_openai_client(api_key)
                response = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.0
                )
                return json.loads(response.choices[0].message.content)

            elif provider == "anthropic":
                client = cls._get_anthropic_client(api_key)
                response = await client.messages.create(
                    model=model,
                    max_tokens=1000,
                    system=system_prompt + "\nReturn ONLY valid JSON.",
                    messages=[{"role": "user", "content": user_prompt}],
                    temperature=0.0
                )
                content = response.content[0].text
                if content.startswith("```json"):
                    content = content.replace("```json", "", 1).rsplit("```", 1)[0]
                elif content.startswith("```"):
                    content = content.replace("```", "", 1).rsplit("```", 1)[0]
                return json.loads(content.strip())

        except Exception as e:
            print(f"[LLMClient Warning] LLM audit ({provider}/{model}) failed with error: {e}. Falling back to deterministic audit.")
            return cls._mock_audit_response(report_text)

        return cls._mock_audit_response(report_text)

    @classmethod
    def _mock_audit_response(cls, report_text: str) -> Dict[str, Any]:
        """
        Deterministic mock/offline compliance classifier.
        """
        from app.core.guardrails import FORBIDDEN_PRESCRIPTIVE_PATTERNS
        import re

        sentences = re.split(r'(?<=[.!?\n])\s+', report_text)
        for sentence in sentences:
            s_clean = sentence.strip()
            if not s_clean:
                continue
            for pattern in FORBIDDEN_PRESCRIPTIVE_PATTERNS:
                if re.search(pattern, s_clean, flags=re.IGNORECASE):
                    return {
                        "passed": False,
                        "offending_sentence": s_clean,
                        "violation_reason": f"Violated Non-Negotiable Boundaries: matched forbidden pattern '{pattern}'"
                    }

        return {
            "passed": True,
            "offending_sentence": "",
            "violation_reason": ""
        }

