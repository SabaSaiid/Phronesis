import asyncio
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.schemas.decision import (
    StructuredDecision,
    AnalysisBundle,
    ReportResponse,
    BenchmarkItem,
    FlagFeedbackRequest,
    OutcomeRetroRequest,
    HistoryItemSummary,
    DrillDownRequest,
    DrillDownResponse,
    DeliberationRequest,
    DeliberationResponse
)
from app.services.extraction_service import ExtractionService
from app.services.matching_service import RubricMatchingService
from app.services.counterargument_service import CounterargumentService
from app.services.synthesis_service import SynthesisService
from app.services.drilldown_service import DrillDownService
from app.services.deliberation_service import DeliberationService
from app.engines.math_engine import DecisionTheoryMathEngine
from app.engines.stoic_engine import StoicPhilosophyEngine
from app.engines.philosophy_engine import PhilosophyEngine
from app.engines.critical_thinking_engine import CriticalThinkingEngine
from app.core.storage import LocalStorage

router = APIRouter()

class ExtractRequest(BaseModel):
    narrative: str

class CounterargumentRequest(BaseModel):
    structured_decision: StructuredDecision
    leading_alternative_id: str

class MemorySettingsRequest(BaseModel):
    enabled: bool

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
    # Launch async rubric matching task concurrently
    bias_task = asyncio.create_task(RubricMatchingService.match_rubric(decision))

    # 1. Math Engine (Pure deterministic)
    math_result = DecisionTheoryMathEngine.compute(decision)

    # 2. Multi-Framework Philosophy Layer (Stoicism, Utilitarianism, Kantian, Virtue Ethics)
    multi_philosophy = PhilosophyEngine.evaluate(decision)
    legacy_stoic = multi_philosophy.stoic_legacy or StoicPhilosophyEngine.evaluate(decision)

    # 3. Critical Thinking Layer (12 Base Rates + Falsifiability)
    critical_result = CriticalThinkingEngine.evaluate(decision)

    # 4. Longitudinal Context (Threshold-gated: N >= 5)
    longitudinal_ctx = LocalStorage.get_longitudinal_summary(decision.domain)

    # Await async bias rubric matching
    bias_result = await bias_task

    return AnalysisBundle(
        structured_decision=decision,
        bias_layer=bias_result,
        math_layer=math_result,
        philosophy_layer=legacy_stoic,
        philosophy_multi_layer=multi_philosophy,
        critical_thinking_layer=critical_result,
        longitudinal_context=longitudinal_ctx
    )

@router.post("/analyze/counterargument")
async def generate_counterargument(req: CounterargumentRequest):
    counter_arg = await CounterargumentService.generate_counterargument(
        req.structured_decision,
        req.leading_alternative_id
    )
    return {"steelmanned_counterargument": counter_arg}

@router.post("/analyze/drill-down", response_model=DrillDownResponse)
async def drill_down_item(req: DrillDownRequest):
    return await DrillDownService.generate_drill_down(req)

@router.post("/deliberate/chat", response_model=DeliberationResponse)
async def deliberate_chat(req: DeliberationRequest):
    return await DeliberationService.deliberate(req)


@router.post("/report/synthesize", response_model=ReportResponse)
async def synthesize_report(bundle: AnalysisBundle):
    report_response = await SynthesisService.synthesize_report(bundle)

    # Auto-save decision if memory opt-in is active
    decision_id = str(uuid.uuid4())
    LocalStorage.save_decision(
        decision_id=decision_id,
        decision=bundle.structured_decision,
        bundle=bundle,
        report=report_response
    )

    return report_response

# Feedback Endpoint
@router.post("/feedback/flag")
async def submit_flag_feedback(req: FlagFeedbackRequest):
    success = LocalStorage.record_feedback(req)
    return {"status": "success" if success else "failed"}

# History & Memory Endpoints
@router.get("/history", response_model=List[HistoryItemSummary])
async def list_history():
    return LocalStorage.list_decisions()

@router.get("/history/export")
async def export_history_data():
    return LocalStorage.export_history()

@router.post("/history/purge")
async def purge_history_data():
    success = LocalStorage.purge_history()
    return {"status": "success" if success else "failed"}

@router.get("/history/{decision_id}")
async def get_history_item(decision_id: str):
    item = LocalStorage.get_decision(decision_id)
    if not item:
        raise HTTPException(status_code=404, detail="Decision record not found.")
    return item

@router.post("/history/{decision_id}/outcome")
async def record_outcome_retro(decision_id: str, req: OutcomeRetroRequest):
    success = LocalStorage.record_outcome(decision_id, req)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to record outcome retrospective.")
    return {"status": "success"}

@router.get("/settings/memory")
async def get_memory_settings():
    return {"memory_enabled": LocalStorage.is_memory_enabled()}

@router.post("/settings/memory")
async def update_memory_settings(req: MemorySettingsRequest):
    LocalStorage.set_memory_enabled(req.enabled)
    return {"status": "success", "memory_enabled": req.enabled}

# 6 Golden Benchmark Scenarios
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
                domain="career",
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
                "We can buy a specialized enterprise SaaS for $48k/year, or spend 4 engineer-months building an in-house ClickHouse pipeline. "
                "Our engineers are eager to build it, but our roadmap has 3 critical user-facing features pending this quarter."
            ),
            structured_decision=StructuredDecision(
                decision_statement="Choose between buying commercial analytics SaaS vs building custom in-house ClickHouse data pipeline.",
                domain="software_engineering",
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
        ),
        BenchmarkItem(
            id="mortgage_vs_investing",
            title="Accelerate 30-Year Mortgage Payoff vs. Broad Market Index Investing",
            narrative=(
                "We have an extra $3,000/month in disposable household savings. Our 30-year mortgage is at a 5.8% fixed interest rate with $420k remaining balance. "
                "We are deciding whether to prepay the mortgage aggressively to eliminate debt in 7 years or invest the capital into low-cost global equity index funds."
            ),
            structured_decision=StructuredDecision(
                decision_statement="Decide between prepaying a 5.8% fixed mortgage vs investing surplus cash flow in equity index funds.",
                domain="personal_finance",
                alternatives=[
                    {"id": "alt_mortgage", "name": "Prepay Mortgage", "description": "Allocate $3k/mo directly to mortgage principal for guaranteed 5.8% risk-free yield."},
                    {"id": "alt_invest", "name": "Invest in Equity Index", "description": "Invest $3k/mo into low-cost diversified global index funds targeting long-term compounding."}
                ],
                states_of_world=[
                    {"id": "state_bull_market", "name": "Equity Markets Average Historical 9% Returns", "prior_probability": 0.60},
                    {"id": "state_stagnant_market", "name": "Prolonged Low-Growth / High-Volatility Market (<5%)", "prior_probability": 0.40}
                ],
                payoff_matrix=[
                    {"alternative_id": "alt_mortgage", "state_id": "state_bull_market", "utility": 75.0, "narrative": "Guaranteed debt-free security, but missed compound growth delta."},
                    {"alternative_id": "alt_mortgage", "state_id": "state_stagnant_market", "utility": 90.0, "narrative": "Guaranteed 5.8% yield heavily outperforms stagnant equities."},
                    {"alternative_id": "alt_invest", "state_id": "state_bull_market", "utility": 95.0, "narrative": "Significantly higher net worth realization over 15-year horizon."},
                    {"alternative_id": "alt_invest", "state_id": "state_stagnant_market", "utility": 45.0, "narrative": "Portfolio underperforms debt interest while carrying market volatility."}
                ],
                goals=["Maximize 15-year net worth", "Maintain psychological peace of mind"],
                constraints=["Emergency liquidity fund of 6 months expenses remains intact"],
                assumptions=[
                    {"id": "m1", "text": "Global equity market returns will exceed 6% net of inflation over next 15 years.", "type": "empirical", "testable": True}
                ],
                unknowns=["Personal career income trajectory over next decade"]
            )
        ),
        BenchmarkItem(
            id="relocate_vs_stay",
            title="Relocate to Major Tech Hub vs. Maintain Hometown Remote Life",
            narrative=(
                "I have been working remotely from my hometown for 3 years near extended family. "
                "I have an opportunity to relocate to San Francisco for high-density serendipity, founder networks, and technical community. "
                "Cost of living will increase 2.2x, and moving will disrupt established family routines."
            ),
            structured_decision=StructuredDecision(
                decision_statement="Decide whether to relocate to San Francisco for career density vs staying in hometown remote baseline.",
                domain="lifestyle",
                alternatives=[
                    {"id": "alt_relocate", "name": "Relocate to SF Hub", "description": "Move to San Francisco to immerse in in-person tech community and venture networks."},
                    {"id": "alt_stay_hometown", "name": "Stay in Hometown", "description": "Maintain low-cost high-comfort remote setup near family and established roots."}
                ],
                states_of_world=[
                    {"id": "state_high_serendipity", "name": "In-Person Density Accelerates Opportunities", "prior_probability": 0.45},
                    {"id": "state_diminishing_hub", "name": "High Living Costs Outweigh Serendipity Gains", "prior_probability": 0.55}
                ],
                payoff_matrix=[
                    {"alternative_id": "alt_relocate", "state_id": "state_high_serendipity", "utility": 92.0, "narrative": "Breakout network acceleration, high career optionality."},
                    {"alternative_id": "alt_relocate", "state_id": "state_diminishing_hub", "utility": 40.0, "narrative": "High financial burn, homesickness, diminished savings rate."},
                    {"alternative_id": "alt_stay_hometown", "state_id": "state_high_serendipity", "utility": 60.0, "narrative": "Financial safety and family comfort, high regret over career isolation."},
                    {"alternative_id": "alt_stay_hometown", "state_id": "state_diminishing_hub", "utility": 80.0, "narrative": "High quality of life, rapid savings accumulation, preserved balance."}
                ],
                goals=["Expand high-density peer network", "Preserve close family bonds and sustainable burn"],
                constraints=["Maximum monthly rent budget of $4,200 in destination city"],
                assumptions=[
                    {"id": "r1", "text": "In-person serendipity will generate tangible collaboration within 12 months.", "type": "empirical", "testable": True}
                ],
                unknowns=["Long-term retention of remote flexibility across industry"]
            )
        ),
        BenchmarkItem(
            id="rewrite_vs_refactor",
            title="Ground-Up Core Engine Rewrite vs. Incremental Modular Refactoring",
            narrative=(
                "Our core backend system has accumulated 6 years of technical debt. Feature velocity has slowed by 40%. "
                "The engineering lead proposes a ground-up rewrite in a modern stack estimated at 5 months. "
                "The product manager worries a rewrite will freeze customer roadmap deliverables for two quarters."
            ),
            structured_decision=StructuredDecision(
                decision_statement="Choose between full ground-up system rewrite vs continuous modular in-place refactoring.",
                domain="software_engineering",
                alternatives=[
                    {"id": "alt_rewrite", "name": "Ground-Up Rewrite", "description": "Build greenfield architecture with modern paradigms over 5 months."},
                    {"id": "alt_refactor", "name": "Modular Refactoring", "description": "Strangler-fig refactor existing modules incrementally while shipping features."}
                ],
                states_of_world=[
                    {"id": "state_clean_delivery", "name": "Rewrite Ships Within 6 Months Without Scope Creep", "prior_probability": 0.25},
                    {"id": "state_rewrite_drag", "name": "Rewrite Stalls / Takes >10 Months with Legacy Feature Parity Drag", "prior_probability": 0.75}
                ],
                payoff_matrix=[
                    {"alternative_id": "alt_rewrite", "state_id": "state_clean_delivery", "utility": 95.0, "narrative": "Massive developer velocity leap, modern architecture."},
                    {"alternative_id": "alt_rewrite", "state_id": "state_rewrite_drag", "utility": 25.0, "narrative": "Severe roadmap freeze, competitor gains ground, team exhaustion."},
                    {"alternative_id": "alt_refactor", "state_id": "state_clean_delivery", "utility": 70.0, "narrative": "Continuous delivery maintained, some residual architectural friction."},
                    {"alternative_id": "alt_refactor", "state_id": "state_rewrite_drag", "utility": 75.0, "narrative": "Safe steady progress, avoids existential project stalling."}
                ],
                goals=["Restore engineering delivery velocity", "Maintain customer feature commitments"],
                constraints=["Team of 8 engineers cannot expand headcount this year"],
                assumptions=[
                    {"id": "rw1", "text": "New architecture will eliminate 80% of current latency and bugs.", "type": "causal", "testable": True}
                ],
                unknowns=["Hidden business edge cases buried in legacy code"]
            )
        ),
        BenchmarkItem(
            id="cofounder_vs_solo",
            title="Solo Bootstrapping vs. 50/50 Co-founding Partnership with Close Friend",
            narrative=(
                "I am launching a B2B vertical AI tool. I can build and bootstrap solo retaining 100% equity and full autonomous velocity. "
                "Alternatively, a close friend and seasoned product designer wants to join as equal 50/50 co-founder. "
                "A co-founder provides complementary design mastery and psychological resilience, but dilutes equity and introduces shared consensus overhead."
            ),
            structured_decision=StructuredDecision(
                decision_statement="Decide between solo founder bootstrapping vs 50/50 equity partnership with close friend.",
                domain="venture_capital",
                alternatives=[
                    {"id": "alt_solo", "name": "Solo Bootstrapping", "description": "Retain 100% equity, complete decision autonomy, bootstrap via contractor support."},
                    {"id": "alt_cofounder", "name": "50/50 Partnership", "description": "Split equity equally with close friend to combine engineering and product design."}
                ],
                states_of_world=[
                    {"id": "state_high_synergy", "name": "Complementary Execution Doubles Velocity & Resilience", "prior_probability": 0.50},
                    {"id": "state_alignment_friction", "name": "Strategic Vision Diverges / Partnership Friction", "prior_probability": 0.50}
                ],
                payoff_matrix=[
                    {"alternative_id": "alt_solo", "state_id": "state_high_synergy", "utility": 70.0, "narrative": "100% ownership, but higher psychological burden and single-point risk."},
                    {"alternative_id": "alt_solo", "state_id": "state_alignment_friction", "utility": 80.0, "narrative": "Protected against co-founder disputes, full agility to pivot."},
                    {"alternative_id": "alt_cofounder", "state_id": "state_high_synergy", "utility": 95.0, "narrative": "World-class product execution, shared emotional load, faster market traction."},
                    {"alternative_id": "alt_cofounder", "state_id": "state_alignment_friction", "utility": 30.0, "narrative": "Deadlock over direction, strained personal friendship, messy cap table."}
                ],
                goals=["Build durable high-growth business", "Protect personal relationship and clarity"],
                constraints=["6 months self-funded runway before seeking revenue"],
                assumptions=[
                    {"id": "cf1", "text": "Friendship will comfortably withstand intense commercial and fundraising stress.", "type": "value_attribution", "testable": False}
                ],
                unknowns=["True market demand for product design differentiation"]
            )
        )
    ]
