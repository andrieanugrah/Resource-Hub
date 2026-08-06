import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, newId, nowIso, countAssetsByLink } from "@/lib/db";
import { requireUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import type { Asset } from "@/lib/db";

type TableName = "categories" | "departments" | "locations" | "licenses";

interface CrudConfig {
  /** The table name in the DB */
  table: TableName;
  /** Prefix for generated IDs (e.g. "cat", "dep", "loc") */
  idPrefix: string;
  /** Fields required on creation (checked for truthiness) */
  requiredCreateFields: string[];
  /**
   * Fields whose lowercase value must be unique across the table.
   * On POST the factory checks that no existing row has the same
   * lowercase value for any of these fields.
   */
  duplicateCheckFields?: string[];
  /** Fields that PATCH is allowed to mutate */
  patchFields: string[];
  /**
   * When deleting, the factory refuses if assets still reference
   * this row via this field (e.g. "category_id").
   */
  assetRefField?: keyof Asset;
  /**
   * Optional extra reference checks before DELETE.
   * Return a human-readable error message to block deletion,
   * or null to allow it.
   */
  additionalDeleteChecks?: (id: string) => Promise<string | null>;
}

/**
 * Build GET + POST handlers for a lookup table's collection route
 * (e.g. `/api/categories/route.ts`).
 */
export function createCollectionRoute(config: CrudConfig) {
  const GET = async () => {
    const user = await requireUser();
    if (!can(user.role, "master.manage"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json(await readTable(config.table));
  };

  const POST = async (req: NextRequest) => {
    const csrfErr = await requireCsrf(req);
    if (csrfErr) return csrfErr;
    const user = await requireUser();
    if (!can(user.role, "master.manage"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();

    // Validate required fields
    for (const f of config.requiredCreateFields) {
      if (!body[f]) {
        const label = f.replace(/_/g, " ");
        return NextResponse.json(
          { error: `${label.charAt(0).toUpperCase() + label.slice(1)} required` },
          { status: 400 },
        );
      }
    }

    // Check duplicate fields
    if (config.duplicateCheckFields?.length) {
      const existing = (await readTable(config.table)) as unknown as Record<string, unknown>[];
      for (const f of config.duplicateCheckFields) {
        if (
          existing.some(
            (row) =>
              String(row[f] ?? "").toLowerCase() ===
              String(body[f] ?? "").toLowerCase(),
          )
        ) {
          const label = f.replace(/_/g, " ");
          return NextResponse.json(
            { error: `${label.charAt(0).toUpperCase() + label.slice(1)} already exists.` },
            { status: 409 },
          );
        }
      }
    }

    // Build the row
    const now = nowIso();
    const row: Record<string, unknown> = { id: newId(config.idPrefix) };
    for (const f of config.patchFields) {
      row[f] = body[f] ?? "";
    }
    // Ensure status defaults to "active" for tables that have it
    if ("status" in row && !row.status) row.status = "active";
    row.created_at = now;
    row.updated_at = now;

    const table = (await readTable(config.table)) as unknown as Record<string, unknown>[];
    table.push(row);
    await writeTable(config.table, table as never);
    await writeAudit({ actorUserId: user.id, actionType: `${config.table.slice(0, -1)}.create`, entityType: config.table.slice(0, -1), entityId: String(row.id), after: row });

    const path = `/${config.table}`;
    revalidatePath(path);

    return NextResponse.json(row, { status: 201 });
  };

  return { GET, POST };
}

/**
 * Build PATCH + DELETE handlers for a lookup table's detail route
 * (e.g. `/api/categories/[id]/route.ts`).
 */
export function createDetailRoute(config: CrudConfig) {
  const PATCH = async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const csrfErr = await requireCsrf(req);
    if (csrfErr) return csrfErr;
    const user = await requireUser();
    if (!can(user.role, "master.manage"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const table = (await readTable(config.table)) as unknown as Record<string, unknown>[];
    const idx = table.findIndex((row) => row.id === id);
    if (idx < 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const before = { ...table[idx] };
    const row = table[idx];
    for (const f of config.patchFields) {
      if (body[f] !== undefined) row[f] = body[f];
    }
    row.updated_at = nowIso();

    table[idx] = row;
    await writeTable(config.table, table as never);
    await writeAudit({ actorUserId: user.id, actionType: `${config.table.slice(0, -1)}.update`, entityType: config.table.slice(0, -1), entityId: id, before, after: row });

    const path = `/${config.table}`;
    revalidatePath(path);
    return NextResponse.json(row);
  };

  const DELETE = async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const csrfErr = await requireCsrf(req);
    if (csrfErr) return csrfErr;
    const user = await requireUser();
    if (!can(user.role, "master.manage"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    // Check asset references
    if (config.assetRefField) {
      const refs = await countAssetsByLink(config.assetRefField, id);
      if (refs > 0) {
        const label = config.table.replace(/s$/, "");
        return NextResponse.json(
          {
            error: `${label.charAt(0).toUpperCase() + label.slice(1)} in use by ${refs} asset${refs !== 1 ? "s" : ""}. Reassign before deleting.`,
          },
          { status: 409 },
        );
      }
    }

    // Additional checks (e.g. user references for departments)
    if (config.additionalDeleteChecks) {
      const err = await config.additionalDeleteChecks(id);
      if (err) return NextResponse.json({ error: err }, { status: 409 });
    }

    const table = (await readTable(config.table)) as unknown as Record<string, unknown>[];
    const filtered = table.filter((row) => row.id !== id);
    if (filtered.length === table.length)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const removed = table.find((row) => row.id === id);
    await writeTable(config.table, filtered as never);
    await writeAudit({ actorUserId: user.id, actionType: `${config.table.slice(0, -1)}.delete`, entityType: config.table.slice(0, -1), entityId: id, before: removed });

    const path = `/${config.table}`;
    revalidatePath(path);
    return NextResponse.json({ ok: true });
  };

  return { PATCH, DELETE };
}
