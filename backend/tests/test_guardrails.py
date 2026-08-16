import pytest
from app.core.guardrails import ReportGuardrail

def test_guardrail_catches_prescriptive_strings():
    bad_text = "Based on the expected utility, you should choose Option A. Score: 92/100. We recommend that you leave your job."
    is_valid, violations = ReportGuardrail.validate_text(bad_text)
    
    assert is_valid is False
    assert len(violations) >= 2

def test_guardrail_catches_diagnostic_labels():
    bad_text = "Your answers indicate that you have the sunk cost fallacy and you suffer from overconfidence."
    is_valid, violations = ReportGuardrail.validate_text(bad_text)
    
    assert is_valid is False
    assert any("bias|fallacy" in v or "suffer" in v for v in violations)

def test_guardrail_passes_observational_language():
    good_text = (
        "Your stated reasoning exhibits structural characteristics consistent with loss aversion. "
        "Under expected utility calculations, Alternative A yields 64.0 compared to 49.5 for Alternative B. "
        "A low-cost experiment to test the key sensitivity variable is suggested."
    )
    is_valid, violations = ReportGuardrail.validate_text(good_text)
    
    assert is_valid is True
    assert len(violations) == 0

def test_guardrail_sanitizes_prescriptive_phrasing():
    bad_text = "You should choose the startup option because we recommend that you pursue upside."
    sanitized = ReportGuardrail.sanitize_or_fallback(bad_text)
    
    assert "you should choose" not in sanitized.lower()
    assert "we recommend that you" not in sanitized.lower()
    assert "one option to inspect is" in sanitized.lower()
