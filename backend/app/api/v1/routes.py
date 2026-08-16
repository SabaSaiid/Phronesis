from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

from app.schemas.decision import (
    StructuredDecision,
    AnalysisBundle,
    ReportResponse,
    BenchmarkItem
)
from app.services.extraction_service import ExtractionService
from app.services.matching_service import RubricMatchingService
from app.services.counterargument_service import CounterargumentService
from app.services.synthesis_service import SynthesisService
from app.engines.math_engine import DecisionTheoryMathEngine
from app.engines.stoic_engine import StoicPhilosophyEngine
from app.engines.critical_thinking_engine import CriticalThinkingEngine

router = APIRouter()

class ExtractRequest(BaseModel):
    narrative: str

class CounterargumentRequest(BaseModel):
    structured_decision: StructuredDecision
    leading_alternative_id: str

@router.post("/extract", response_model=Dict[str, Any])
async def extract_decision(req: ExtractRequest):
    if len(req.narrative.strip()) < 10:
        raise HTTPException(status_code=400, detail="Narrative too short (minimum 10 characters).")
    decision = await ExtractionService.extract_structured_decision(req.narrative)
    return {
        "status": "success",
        "structured_decision": decision.model_dump(),
        "extraction_confidence": 0.95
    }

@router.post("/analyze/deterministic", response_model=AnalysisBundle)
async def analyze_deterministic(decision: StructuredDecision):
    # 1. Math Engine (Pure deterministic)
    math_result = DecisionTheoryMathEngine.compute(decision)
    
    # 2. Bias Layer (Rubric lookup table matching)
    bias_result = await RubricMatchingService.match_rubric(decision)
    
    # 3. Stoic Philosophy Layer
    stoic_result = StoicPhilosophyEngine.evaluate(decision)
    
    # 4. Critical Thinking Layer
    critical_result = CriticalThinkingEngine.evaluate(decision)

    return AnalysisBundle(
        structured_decision=decision,
        bias_layer=bias_result,
        math_layer=math_result,
        philosophy_layer=stoic_result,
        critical_thinking_layer=critical_result
    )

@router.post("/analyze/counterargument")
async def generate_counterargument(req: CounterargumentRequest):
    counter_arg = await CounterargumentService.generate_counterargument(
        req.structured_decision,
        req.leading_alternative_id
    )
    return {"steelmanned_counterargument": counter_arg}

@router.post("/report/synthesize", response_model=ReportResponse)
async def synthesize_report(bundle: AnalysisBundle):
    report_response = await SynthesisService.synthesize_report(bundle)
    return report_response

@router.get("/benchmarks", response_model=List[BenchmarkItem])
async def get_benchmarks():
    return [
        BenchmarkItem(
            id="tech_career_pivot",
            title="Enterprise Staff Role vs. Pre-Seed Founding Engineer",
            narrative=(
                "I am currently a Staff Software Engineer at an enterprise company making $280k/yr. "
                "The job is comfortable and stable, but I feel my AI skills are stagnating. "
                "I have been offered a Founding Engineer role at a pre-seed AI startup with $140k salary + 2.5% equity. "
                "They have 14 months of runway. My spouse earns $90k and we have $80k savings. "
                "I have spent 5 years here and have $120k in unvested RSUs over the next 18 months. "
                "If the startup fails, I worry I won't easily land another staff role in this market."
            ),
            structured_decision=StructuredDecision(
                decision_statement="Choose whether to remain in current enterprise Staff role or join pre-seed AI startup as Founding Engineer.",
                alternatives=[
                    {"id": "alt_stay", "name": "Stay at Enterprise", "description": "Maintain Staff role with $280k total comp and predictable 35hr work week."},
                    {"id": "alt_startup", "name": "Join AI Startup", "description": "Accept Founding Engineer role with $140k salary + 2.5% equity with 14mo runway."}
                ],
                states_of_world=[
                    {"id": "state_startup_wins", "name": "Startup Succeeds / Reaches Series A", "prior_probability": 0.30},
                    {"id": "state_startup_fails", "name": "Startup Stalls / Shuts Down in 18mo", "prior_probability": 0.70}
                ],
                payoff_matrix=[
                    {"alternative_id": "alt_stay", "state_id": "state_startup_wins", "utility": 50.0, "narrative": "Financial stability, high regret over missed equity upside."},
                    {"alternative_id": "alt_stay", "state_id": "state_startup_fails", "utility": 70.0, "narrative": "Financial safety, relief at avoiding failed venture, ongoing skill stagnation."},
                    {"alternative_id": "alt_startup", "state_id": "state_startup_wins", "utility": 95.0, "narrative": "Substantial financial upside, career acceleration, steep technical mastery."},
                    {"alternative_id": "alt_startup", "state_id": "state_startup_fails", "utility": 30.0, "narrative": "Income drop, loss of unvested equity, need to re-enter job market."}
                ],
                goals=[
                    "Maximize long-term career growth & AI technical mastery",
                    "Preserve household financial baseline"
                ],
                constraints=[
                    "Household living costs require minimum $120k combined income",
                    "Emergency fund of $80k provides 8 months buffer if unemployed"
                ],
                assumptions=[
                    {"id": "assump_1", "text": "Finding another Staff Engineer job in 14-18 months will be difficult if the startup fails.", "type": "empirical", "testable": True},
                    {"id": "assump_2", "text": "The 5 years spent and $120k unvested RSUs represent lost value if abandoned.", "type": "value_attribution", "testable": False},
                    {"id": "assump_3", "text": "Remaining at current job guarantees skill stagnation during the current AI cycle.", "type": "causal", "testable": True}
                ],
                unknowns=[
                    "True probability of startup securing follow-on Series A in current climate",
                    "Actual time and compensation distribution for re-hiring at Staff level in 2026/2027"
                ]
            )
        ),
        BenchmarkItem(
            id="saas_build_vs_buy",
            title="Build Custom Internal Analytics vs. Buy Vendor SaaS",
            narrative=(
                "Our product engineering team needs a comprehensive event analytics platform. "
                "We can buy a specialized enterprise SaaS for $48k/year, or spend 4 engineer-months building an in-house clickhouse pipeline. "
                "Our engineers are eager to build it, but our roadmap has 3 critical user-facing features pending this quarter."
            ),
            structured_decision=StructuredDecision(
                decision_statement="Choose between buying a commercial analytics SaaS vs building an internal data pipeline.",
                alternatives=[
                    {"id": "alt_buy", "name": "Buy Enterprise SaaS", "description": "Pay $48k/year for instant deployment and vendor SLA maintenance."},
                    {"id": "alt_build", "name": "Build Internal System", "description": "Dedicate 4 engineer-months to build customized ClickHouse pipeline."}
                ],
                states_of_world=[
                    {"id": "state_high_scale", "name": "Event Volume Explodes 10x", "prior_probability": 0.35},
                    {"id": "state_normal_scale", "name": "Moderate Predictable Growth", "prior_probability": 0.65}
                ],
                payoff_matrix=[
                    {"alternative_id": "alt_buy", "state_id": "state_high_scale", "utility": 60.0, "narrative": "SaaS tiers become expensive, but zero engineering diversion."},
                    {"alternative_id": "alt_buy", "state_id": "state_normal_scale", "utility": 85.0, "narrative": "Fast time to market, core roadmap features delivered on time."},
                    {"alternative_id": "alt_build", "state_id": "state_high_scale", "utility": 90.0, "narrative": "Low marginal infra cost, bespoke data schema optimizations."},
                    {"alternative_id": "alt_build", "state_id": "state_normal_scale", "utility": 40.0, "narrative": "Substantial maintenance overhead, user-facing feature delays."}
                ],
                goals=["Accelerate analytics availability", "Protect core product feature delivery"],
                constraints=["Engineering team of 6 engineers", "Annual SaaS budget cap of $60k"],
                assumptions=[
                    {"id": "a1", "text": "Building internal system will only take 4 engineer-months without long-term maintenance drag.", "type": "empirical", "testable": True}
                ],
                unknowns=["Internal infrastructure maintenance cost per year"]
            )
        )
    ]
