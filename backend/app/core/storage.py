import os
import json
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.schemas.decision import (
    StructuredDecision,
    AnalysisBundle,
    ReportResponse,
    LongitudinalPatternContext,
    FlagFeedbackRequest,
    OutcomeRetroRequest,
    HistoryItemSummary
)

DEFAULT_DB_DIR = os.path.expanduser("~/.phronesis")
DEFAULT_DB_PATH = os.path.join(DEFAULT_DB_DIR, "phronesis.db")

class LocalStorage:
    """
    Local-Only Sovereign SQLite Storage Layer for Phronesis V2.
    - Zero network dependencies, zero multi-tenant auth overhead
    - WAL-mode SQLite database storing decision records, outcomes, and local feedback
    - Threshold-gated longitudinal pattern summary retrieval (N >= 5)
    """

    _db_path: str = DEFAULT_DB_PATH

    @classmethod
    def set_db_path(cls, path: str):
        cls._db_path = path

    @classmethod
    def get_db_path(cls) -> str:
        override = os.environ.get("PHRONESIS_DB_PATH")
        if override:
            return override
        return cls._db_path

    @classmethod
    def get_connection(cls) -> sqlite3.Connection:
        db_path = cls.get_db_path()
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            try:
                os.makedirs(db_dir, exist_ok=True)
            except Exception:
                db_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "phronesis.db")
                os.makedirs(os.path.dirname(db_path), exist_ok=True)
                cls._db_path = db_path

        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        cls._init_tables(conn)
        return conn

    @classmethod
    def _init_tables(cls, conn: sqlite3.Connection):
        with conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS user_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            """)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS decisions (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                domain TEXT NOT NULL,
                decision_statement TEXT NOT NULL,
                structured_decision_json TEXT NOT NULL,
                analysis_bundle_json TEXT NOT NULL,
                report_markdown TEXT NOT NULL,
                key_sensitive_variable TEXT,
                preferred_eu_alt TEXT,
                minimax_regret_choice TEXT,
                flagged_bias_ids TEXT
            );
            """)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS decision_outcomes (
                id TEXT PRIMARY KEY,
                decision_id TEXT NOT NULL UNIQUE,
                recorded_at TEXT NOT NULL,
                chosen_alternative_id TEXT NOT NULL,
                actual_utility_rating REAL,
                retrospective_notes TEXT,
                FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
            );
            """)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS flag_feedback (
                id TEXT PRIMARY KEY,
                decision_id TEXT NOT NULL,
                flag_id TEXT NOT NULL,
                flag_type TEXT NOT NULL,
                is_positive INTEGER NOT NULL,
                feedback_reason TEXT,
                created_at TEXT NOT NULL
            );
            """)

    @classmethod
    def is_memory_enabled(cls) -> bool:
        try:
            with cls.get_connection() as conn:
                cur = conn.cursor()
                cur.execute("SELECT value FROM user_settings WHERE key = 'memory_opt_in'")
                row = cur.fetchone()
                if row:
                    return row["value"] == "true"
                return False
        except Exception:
            return False

    @classmethod
    def set_memory_enabled(cls, enabled: bool):
        with cls.get_connection() as conn:
            val = "true" if enabled else "false"
            conn.execute(
                "INSERT INTO user_settings (key, value) VALUES ('memory_opt_in', ?) ON CONFLICT(key) DO UPDATE SET value = ?",
                (val, val)
            )

    @classmethod
    def save_decision(
        cls,
        decision_id: str,
        decision: StructuredDecision,
        bundle: AnalysisBundle,
        report: ReportResponse
    ) -> bool:
        if not cls.is_memory_enabled():
            return False

        try:
            with cls.get_connection() as conn:
                bias_ids = ",".join(p.id for p in bundle.bias_layer.flagged_patterns)
                conn.execute("""
                INSERT INTO decisions (
                    id, timestamp, domain, decision_statement,
                    structured_decision_json, analysis_bundle_json,
                    report_markdown, key_sensitive_variable,
                    preferred_eu_alt, minimax_regret_choice,
                    flagged_bias_ids
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    decision_id,
                    datetime.now(timezone.utc).isoformat(),
                    decision.domain or "general",
                    decision.decision_statement,
                    decision.model_dump_json(),
                    bundle.model_dump_json(),
                    report.report_markdown,
                    report.key_sensitive_variable,
                    bundle.math_layer.expected_utility.preferred_alternative_id,
                    bundle.math_layer.minimax_regret.minimax_regret_choice,
                    bias_ids
                ))
            return True
        except Exception as e:
            print(f"[LocalStorage Error] Failed to save decision: {e}")
            return False

    @classmethod
    def list_decisions(cls) -> List[HistoryItemSummary]:
        try:
            with cls.get_connection() as conn:
                cur = conn.cursor()
                cur.execute("""
                SELECT d.id, d.timestamp, d.domain, d.decision_statement,
                       d.preferred_eu_alt, d.minimax_regret_choice, d.flagged_bias_ids,
                       o.chosen_alternative_id, o.actual_utility_rating
                FROM decisions d
                LEFT JOIN decision_outcomes o ON d.id = o.decision_id
                ORDER BY d.timestamp DESC
                """)
                rows = cur.fetchall()
                summaries = []
                for r in rows:
                    bias_list = [b.strip() for b in r["flagged_bias_ids"].split(",") if b.strip()] if r["flagged_bias_ids"] else []
                    has_outcome = r["chosen_alternative_id"] is not None
                    summaries.append(
                        HistoryItemSummary(
                            id=r["id"],
                            timestamp=r["timestamp"],
                            domain=r["domain"],
                            decision_statement=r["decision_statement"],
                            preferred_eu_alt=r["preferred_eu_alt"],
                            minimax_regret_choice=r["minimax_regret_choice"],
                            flagged_bias_ids=bias_list,
                            has_outcome=has_outcome,
                            chosen_alternative_id=r["chosen_alternative_id"],
                            actual_utility_rating=r["actual_utility_rating"]
                        )
                    )
                return summaries
        except Exception as e:
            print(f"[LocalStorage Error] Failed to list decisions: {e}")
            return []

    @classmethod
    def get_decision(cls, decision_id: str) -> Optional[Dict[str, Any]]:
        try:
            with cls.get_connection() as conn:
                cur = conn.cursor()
                cur.execute("""
                SELECT d.*, o.chosen_alternative_id, o.actual_utility_rating, o.retrospective_notes, o.recorded_at as outcome_recorded_at
                FROM decisions d
                LEFT JOIN decision_outcomes o ON d.id = o.decision_id
                WHERE d.id = ?
                """, (decision_id,))
                row = cur.fetchone()
                if not row:
                    return None
                
                return {
                    "id": row["id"],
                    "timestamp": row["timestamp"],
                    "domain": row["domain"],
                    "decision_statement": row["decision_statement"],
                    "structured_decision": json.loads(row["structured_decision_json"]),
                    "analysis_bundle": json.loads(row["analysis_bundle_json"]),
                    "report_markdown": row["report_markdown"],
                    "key_sensitive_variable": row["key_sensitive_variable"],
                    "preferred_eu_alt": row["preferred_eu_alt"],
                    "minimax_regret_choice": row["minimax_regret_choice"],
                    "outcome": {
                        "chosen_alternative_id": row["chosen_alternative_id"],
                        "actual_utility_rating": row["actual_utility_rating"],
                        "retrospective_notes": row["retrospective_notes"],
                        "recorded_at": row["outcome_recorded_at"]
                    } if row["chosen_alternative_id"] else None
                }
        except Exception as e:
            print(f"[LocalStorage Error] Failed to get decision: {e}")
            return None

    @classmethod
    def record_outcome(cls, decision_id: str, req: OutcomeRetroRequest) -> bool:
        try:
            with cls.get_connection() as conn:
                outcome_id = str(uuid.uuid4())
                recorded_at = datetime.now(timezone.utc).isoformat()
                conn.execute("""
                INSERT INTO decision_outcomes (
                    id, decision_id, recorded_at, chosen_alternative_id,
                    actual_utility_rating, retrospective_notes
                ) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(decision_id) DO UPDATE SET
                    recorded_at = excluded.recorded_at,
                    chosen_alternative_id = excluded.chosen_alternative_id,
                    actual_utility_rating = excluded.actual_utility_rating,
                    retrospective_notes = excluded.retrospective_notes
                """, (
                    outcome_id,
                    decision_id,
                    recorded_at,
                    req.chosen_alternative_id,
                    req.actual_utility_rating,
                    req.retrospective_notes
                ))
            return True
        except Exception as e:
            print(f"[LocalStorage Error] Failed to record outcome: {e}")
            return False

    @classmethod
    def record_feedback(cls, req: FlagFeedbackRequest) -> bool:
        try:
            with cls.get_connection() as conn:
                fb_id = str(uuid.uuid4())
                created_at = datetime.now(timezone.utc).isoformat()
                conn.execute("""
                INSERT INTO flag_feedback (
                    id, decision_id, flag_id, flag_type,
                    is_positive, feedback_reason, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    fb_id,
                    req.decision_id,
                    req.flag_id,
                    req.flag_type,
                    1 if req.is_positive else 0,
                    req.feedback_reason,
                    created_at
                ))
            return True
        except Exception as e:
            print(f"[LocalStorage Error] Failed to record feedback: {e}")
            return False

    @classmethod
    def get_longitudinal_summary(cls, target_domain: Optional[str] = None) -> Optional[LongitudinalPatternContext]:
        """
        Threshold-Gated Longitudinal Context Aggregator:
        Only emits summary insights if total logged decisions >= 5 and memory is opted in.
        """
        if not cls.is_memory_enabled():
            return None

        try:
            with cls.get_connection() as conn:
                cur = conn.cursor()
                cur.execute("SELECT COUNT(*) as cnt FROM decisions")
                total_cnt = cur.fetchone()["cnt"]
                if total_cnt < 5:
                    return None

                # Extract last 10 decisions
                cur.execute("SELECT id, domain, flagged_bias_ids FROM decisions ORDER BY timestamp DESC LIMIT 10")
                recent_rows = cur.fetchall()

                bias_counts: Dict[str, int] = {}
                for r in recent_rows:
                    if r["flagged_bias_ids"]:
                        b_ids = [b.strip() for b in r["flagged_bias_ids"].split(",") if b.strip()]
                        for bid in b_ids:
                            bias_counts[bid] = bias_counts.get(bid, 0) + 1

                # Format neutral observational summary string
                top_biases = sorted(bias_counts.items(), key=lambda x: x[1], reverse=True)[:2]
                bias_phrases = [f"'{b[0]}' was flagged in {b[1]} instances" for b in top_biases if b[1] >= 2]

                domain_text = f" across {len(recent_rows)} recent decisions"
                if target_domain and target_domain != "general":
                    cur.execute("SELECT COUNT(*) as d_cnt FROM decisions WHERE domain = ?", (target_domain,))
                    d_cnt = cur.fetchone()["d_cnt"]
                    domain_text += f" ({d_cnt} in {target_domain})"

                bias_summary = ", and ".join(bias_phrases) if bias_phrases else "no single cognitive pattern dominated"
                summary_text = (
                    f"Longitudinal history ({total_cnt} total decisions logged): Over your recent decisions{domain_text}, "
                    f"{bias_summary}. This cross-decision context is provided as an observational reference."
                )

                return LongitudinalPatternContext(
                    total_decisions_logged=total_cnt,
                    recurring_bias_counts=bias_counts,
                    average_base_rate_divergence_pct=None,
                    summary_text=summary_text
                )
        except Exception as e:
            print(f"[LocalStorage Error] Failed to get longitudinal summary: {e}")
            return None

    @classmethod
    def export_history(cls) -> Dict[str, Any]:
        try:
            with cls.get_connection() as conn:
                cur = conn.cursor()
                cur.execute("SELECT * FROM decisions ORDER BY timestamp ASC")
                decisions_rows = [dict(r) for r in cur.fetchall()]
                cur.execute("SELECT * FROM decision_outcomes ORDER BY recorded_at ASC")
                outcomes_rows = [dict(r) for r in cur.fetchall()]
                cur.execute("SELECT * FROM flag_feedback ORDER BY created_at ASC")
                feedback_rows = [dict(r) for r in cur.fetchall()]

                return {
                    "version": "2.0",
                    "exported_at": datetime.now(timezone.utc).isoformat(),
                    "decisions": decisions_rows,
                    "outcomes": outcomes_rows,
                    "feedback": feedback_rows
                }
        except Exception as e:
            return {"error": str(e)}

    @classmethod
    def purge_history(cls) -> bool:
        try:
            with cls.get_connection() as conn:
                conn.execute("DELETE FROM decision_outcomes;")
                conn.execute("DELETE FROM decisions;")
                conn.execute("DELETE FROM flag_feedback;")
            # Vacuum outside transaction block
            conn = sqlite3.connect(cls.get_db_path())
            conn.isolation_level = None
            conn.execute("VACUUM;")
            conn.close()
            return True
        except Exception as e:
            print(f"[LocalStorage Error] Failed to purge history: {e}")
            return False
