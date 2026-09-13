import json
import os
import functools
from typing import List, Optional
from app.schemas.decision import (
    StructuredDecision,
    DomainLayerResult,
    DomainFrameworkMatch,
    DomainChecklistItem
)
from app.engines.base import BaseDeterministicEngine, EngineRegistry


@EngineRegistry.register
class DomainEngine(BaseDeterministicEngine):
    """
    Domain-Specific Strategic Frameworks Engine (Layer 7):
    - Evaluates decisions against high-leverage operational mental models
    - Supported domains: career transitions, startup & venture, software & engineering, finance & capital
    - Yields structured diagnostic checklists and reflective risk probing questions
    - Guaranteed zero prescriptiveness with full literature source attribution
    """
    engine_id = "domain_engine_v1"
    engine_name = "Domain-Specific Decision Frameworks Engine"
    layer_number = 7

    @classmethod
    @functools.lru_cache(maxsize=1)
    def get_domain_frameworks(cls) -> List[dict]:
        kb_path = os.path.join(os.path.dirname(__file__), "..", "knowledge", "domain_frameworks.json")
        if not os.path.exists(kb_path):
            return []
        with open(kb_path, "r", encoding="utf-8") as f:
            return json.load(f)

    @classmethod
    def evaluate(cls, decision: StructuredDecision, **kwargs) -> DomainLayerResult:
        frameworks = cls.get_domain_frameworks()
        if not frameworks:
            return DomainLayerResult(
                matched_frameworks=[],
                primary_domain=decision.domain or "general",
                domain_insights_summary="No domain frameworks database available."
            )

        domain_str = (decision.domain or "").lower().strip()
        all_text = (
            decision.decision_statement + " " +
            " ".join(a.description for a in decision.alternatives) + " " +
            " ".join(s.name for s in decision.states_of_world) + " " +
            " ".join(decision.goals) + " " +
            " ".join(decision.constraints) + " " +
            " ".join(assump.text for assump in decision.assumptions) + " " +
            " ".join(decision.unknowns) + " " +
            domain_str
        ).lower()

        # Score each framework
        scored_frameworks = []
        domain_counts = {}

        for fw in frameworks:
            fw_domain = fw.get("domain", "").lower()
            # Check domain bonus
            is_domain_match = bool(domain_str and (domain_str in fw_domain or fw_domain in domain_str))
            domain_bonus = 3.0 if is_domain_match else 0.0

            # Count keyword matches
            kw_hits = sum(1.0 for kw in fw.get("keywords", []) if kw in all_text)
            total_score = domain_bonus + kw_hits

            if total_score >= 1.5:
                scored_frameworks.append((total_score, fw))
                domain_counts[fw_domain] = domain_counts.get(fw_domain, 0) + 1

        # Sort by score descending and take up to top 3
        scored_frameworks.sort(key=lambda x: x[0], reverse=True)
        top_frameworks = [item[1] for item in scored_frameworks[:3]]

        # If none met threshold, select the best matching domain framework or default
        if not top_frameworks and frameworks:
            top_frameworks = [frameworks[0]]

        # Determine primary domain
        primary_domain = decision.domain or "general"
        if domain_counts:
            primary_domain = max(domain_counts.items(), key=lambda x: x[1])[0]

        matched_results: List[DomainFrameworkMatch] = []
        for fw in top_frameworks:
            checklist_items = [
                DomainChecklistItem(
                    check_item=chk.get("check_item", ""),
                    risk_flag=chk.get("risk_flag", ""),
                    probing_question=chk.get("probing_question", "")
                )
                for chk in fw.get("diagnostic_checklist", [])
            ]
            matched_results.append(
                DomainFrameworkMatch(
                    id=fw.get("id", ""),
                    framework_name=fw.get("framework_name", ""),
                    domain=fw.get("domain", ""),
                    field=fw.get("field", ""),
                    source=fw.get("source", ""),
                    core_idea=fw.get("core_idea", ""),
                    matched_checklist=checklist_items
                )
            )

        summary_narrative = (
            f"Evaluated against {len(matched_results)} domain operational frameworks in '{primary_domain}'. "
            f"Highlighted diagnostic checks address structural risks commonly encountered in similar decisions."
        )

        return DomainLayerResult(
            matched_frameworks=matched_results,
            primary_domain=primary_domain,
            domain_insights_summary=summary_narrative
        )
