import pytest
from app.schemas.decision import (
    StructuredDecision,
    DeliberationRequest,
    ChatMessageSchema
)
from app.services.deliberation_service import DeliberationService, LENS_METADATA
from app.api.v1.routes import deliberate_chat

@pytest.fixture
def sample_decision():
    return StructuredDecision(
        decision_statement="Decide between remaining in stable job ($190k) or joining seed AI startup (1% equity).",
        alternatives=[
            {"id": "alt_stable", "name": "Stable Job", "description": "High salary and security"},
            {"id": "alt_startup", "name": "Seed Startup", "description": "Equity upside and agency"}
        ],
        states_of_world=[
            {"id": "s1", "name": "Market Boom", "prior_probability": 0.4},
            {"id": "s2", "name": "Downturn", "prior_probability": 0.6}
        ],
        payoff_matrix=[
            {"alternative_id": "alt_stable", "state_id": "s1", "utility": 65.0},
            {"alternative_id": "alt_stable", "state_id": "s2", "utility": 75.0},
            {"alternative_id": "alt_startup", "state_id": "s1", "utility": 95.0},
            {"alternative_id": "alt_startup", "state_id": "s2", "utility": 25.0}
        ],
        assumptions=[
            {"id": "a1", "text": "Startup has 14 months runway.", "type": "empirical", "testable": True}
        ]
    )

@pytest.mark.asyncio
async def test_socratic_deliberation_default(sample_decision):
    req = DeliberationRequest(
        messages=[
            ChatMessageSchema(
                id="msg-1",
                sender="user",
                text="What are my blind spots in this decision?",
                timestamp=1000,
                lens="socratic"
            )
        ],
        current_step="input",
        lens="socratic",
        structured_decision=sample_decision
    )
    
    resp = await DeliberationService.deliberate(req)
    assert resp.reply_text is not None
    assert len(resp.reply_text) > 50
    assert resp.lens_used == "socratic"
    assert resp.attribution is not None
    assert "Socratic" in resp.attribution.referenced_item
    assert len(resp.suggested_followups) == 3
    assert resp.suggested_action is not None

@pytest.mark.asyncio
async def test_all_lenses_generate_valid_deliberation(sample_decision):
    lenses = ["socratic", "steelman", "stoic", "kantian", "utilitarian", "virtue", "voi", "bias"]
    
    for lens in lenses:
        req = DeliberationRequest(
            messages=[
                ChatMessageSchema(
                    id="msg-1",
                    sender="user",
                    text=f"Examine this through the {lens} lens.",
                    timestamp=1000,
                    lens=lens
                )
            ],
            current_step="editor",
            lens=lens,
            structured_decision=sample_decision
        )
        
        resp = await DeliberationService.deliberate(req)
        assert resp.reply_text is not None
        assert len(resp.reply_text) > 30
        assert resp.lens_used == lens
        assert resp.attribution is not None
        assert len(resp.suggested_followups) >= 1

@pytest.mark.asyncio
async def test_deliberate_chat_route(sample_decision):
    req = DeliberationRequest(
        messages=[
            ChatMessageSchema(
                id="msg-1",
                sender="user",
                text="How can I design a 48-hour test for this?",
                timestamp=1000,
                lens="voi"
            )
        ],
        current_step="report",
        lens="voi",
        structured_decision=sample_decision,
        math_summary={"preferred_eu_alt": "Stable Job", "minimax_regret_choice": "Stable Job", "inflection_threshold": 0.62}
    )
    
    resp = await deliberate_chat(req)
    assert resp.reply_text is not None
    assert "48-Hour" in resp.reply_text or "VoI" in resp.reply_text or "Test" in resp.reply_text
    assert resp.lens_used == "voi"
    assert resp.suggested_action is not None
    assert resp.suggested_action.action_type in ["test_protocol", "insert_assumption", "append_narrative"]
