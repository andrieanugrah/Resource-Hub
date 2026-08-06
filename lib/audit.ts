import { readTable, writeTable, nowIso, newId, type AuditLog } from "./db";

const SENSITIVE_KEYS = new Set(["password_hash", "password_salt"]);

function redact(obj: unknown): unknown {
  if (obj && typeof obj === "object") {
    if (Array.isArray(obj)) return obj.map(redact);
    const clone: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k)) continue;
      clone[k] = redact(v);
    }
    return clone;
  }
  return obj;
}

export async function writeAudit(params: {
  actorUserId: string; actionType: string; entityType: string; entityId: string;
  before?: unknown; after?: unknown; ip?: string; userAgent?: string;
}): Promise<void> {
  const logs = await readTable("audit_logs");
  const entry: AuditLog = {
    id: newId("aud"), actor_user_id: params.actorUserId, action_type: params.actionType,
    entity_type: params.entityType, entity_id: params.entityId,
    before_json: params.before === undefined ? null : JSON.stringify(redact(params.before)),
    after_json: params.after === undefined ? null : JSON.stringify(redact(params.after)),
    ip_address: params.ip ?? "", user_agent: params.userAgent ?? "", created_at: nowIso(),
  };
  logs.unshift(entry);
  await writeTable("audit_logs", logs);
}
