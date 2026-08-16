import re
from typing import Tuple, List

FORBIDDEN_PRESCRIPTIVE_PATTERNS = [
    r"\byou should choose\b",
    r"\byou must (choose|pick|select|decide)\b",
    r"\byou have (the )?[a-z\-]+ (bias|fallacy)\b",
    r"\byou suffer from\b",
    r"\bthe correct (choice|decision|option) is\b",
    r"\bthe optimal choice is\b",
    r"\bscore:? \d+/\d+\b",
    r"\bwe recommend that you\b",
    r"\bi recommend (that )?you\b",
    r"\bthe only logical choice\b"
]

class ReportGuardrail:
    """
    Post-generation linter enforcing:
    1. Zero prescriptive verdicts
    2. Strict observational pattern language (no psychological labeling)
    3. Absence of arbitrary composite scoring
    """

    @classmethod
    def validate_text(cls, text: str) -> Tuple[bool, List[str]]:
        violations = []
        for pattern in FORBIDDEN_PRESCRIPTIVE_PATTERNS:
            matches = re.findall(pattern, text, flags=re.IGNORECASE)
            if matches:
                violations.append(f"Forbidden pattern detected: '{pattern}'")
        return len(violations) == 0, violations

    @classmethod
    def sanitize_or_fallback(cls, text: str) -> str:
        sanitized = text
        for pattern in FORBIDDEN_PRESCRIPTIVE_PATTERNS:
            # Replace prescriptive phrasing with observational framing
            sanitized = re.sub(r"\byou should choose\b", "one option to inspect is", sanitized, flags=re.IGNORECASE)
            sanitized = re.sub(r"\byou must choose\b", "your decision model highlights", sanitized, flags=re.IGNORECASE)
            sanitized = re.sub(r"\byou have (the )?([a-z\-]+) (bias|fallacy)\b", r"your framing exhibits characteristics consistent with \2", sanitized, flags=re.IGNORECASE)
            sanitized = re.sub(r"\bwe recommend that you\b", "a low-cost next step to evaluate is", sanitized, flags=re.IGNORECASE)
            sanitized = re.sub(r"\bi recommend that you\b", "a low-cost next step to evaluate is", sanitized, flags=re.IGNORECASE)
        return sanitized
