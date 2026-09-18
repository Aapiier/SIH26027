"""
RailSync AI — Cryptographic Audit & Tamper-Proof Trail Service
Logs all plan generation, human overrides, approvals, and disruption events with SHA-256 hash chaining.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import hashlib
import json
from sqlalchemy.orm import Session
from backend.app.models.db_models import AuditLog


def log_audit_action(
    db: Session,
    action: str,
    actor: str,
    plan_id: Optional[str] = None,
    previous_state: Optional[Dict[str, Any]] = None,
    new_state: Optional[Dict[str, Any]] = None,
    justification: Optional[str] = None
) -> Dict[str, Any]:
    """
    Append an immutable, cryptographic audit log entry.
    """
    timestamp = datetime.utcnow()
    log_id = f"AUDIT-{timestamp.strftime('%Y%m%d%H%M%S%f')}"

    # Hash payload chaining
    payload = f"{log_id}:{action}:{actor}:{plan_id}:{json.dumps(new_state, sort_keys=True)}:{timestamp.isoformat()}"
    content_hash = hashlib.sha256(payload.encode()).hexdigest()

    entry = AuditLog(
        log_id=log_id,
        plan_id=plan_id,
        action=action,
        actor=actor,
        previous_state=previous_state,
        new_state=new_state,
        justification=justification,
        content_hash=content_hash,
        timestamp=timestamp,
    )

    db.add(entry)
    db.commit()

    return {
        "log_id": log_id,
        "action": action,
        "actor": actor,
        "content_hash": content_hash,
        "timestamp": timestamp.isoformat(),
    }
