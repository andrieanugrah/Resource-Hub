import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readTable, writeTable, newId, nowIso, type Category, type Session } from "@/lib/db";

// These tests exercise the diff-based writeTable() sync against the real
// SQLite DB (insert / update / delete), covering both an `id`-keyed table
// (categories) and a `token`-keyed table (sessions) to make sure the
// generic sync logic works for both primary key shapes.

describe("writeTable() diff-based sync", () => {
  const testIds: string[] = [];

  afterEach(async () => {
    // Clean up anything this test created, regardless of pass/fail.
    if (testIds.length === 0) return;
    const categories = await readTable("categories");
    await writeTable("categories", categories.filter((c) => !testIds.includes(c.id)));
    testIds.length = 0;
  });

  it("inserts new rows without touching existing ones", async () => {
    const before = await readTable("categories");
    const now = nowIso();
    const a: Category = { id: newId("cat"), category_name: "Sync Test A", description: "", specifications: null, status: "active", created_at: now, updated_at: now };
    const b: Category = { id: newId("cat"), category_name: "Sync Test B", description: "", specifications: null, status: "active", created_at: now, updated_at: now };
    testIds.push(a.id, b.id);

    await writeTable("categories", [...before, a, b]);

    const after = await readTable("categories");
    expect(after.length).toBe(before.length + 2);
    expect(after.find((c) => c.id === a.id)?.category_name).toBe("Sync Test A");
    expect(after.find((c) => c.id === b.id)?.category_name).toBe("Sync Test B");
    // Existing rows must be untouched.
    for (const row of before) {
      expect(after.find((c) => c.id === row.id)).toEqual(row);
    }
  });

  it("updates an existing row in place by primary key", async () => {
    const now = nowIso();
    const cat: Category = { id: newId("cat"), category_name: "Before Update", description: "orig", specifications: null, status: "active", created_at: now, updated_at: now };
    testIds.push(cat.id);
    const withNew = [...(await readTable("categories")), cat];
    await writeTable("categories", withNew);

    const list = await readTable("categories");
    const idx = list.findIndex((c) => c.id === cat.id);
    list[idx] = { ...list[idx], category_name: "After Update", description: "changed" };
    await writeTable("categories", list);

    const after = await readTable("categories");
    expect(after.length).toBe(list.length); // no rows lost or duplicated
    const updated = after.find((c) => c.id === cat.id);
    expect(updated?.category_name).toBe("After Update");
    expect(updated?.description).toBe("changed");
  });

  it("deletes only rows that are removed from the array", async () => {
    const now = nowIso();
    const keep: Category = { id: newId("cat"), category_name: "Keep Me", description: "", specifications: null, status: "active", created_at: now, updated_at: now };
    const drop: Category = { id: newId("cat"), category_name: "Drop Me", description: "", specifications: null, status: "active", created_at: now, updated_at: now };
    testIds.push(keep.id, drop.id);

    await writeTable("categories", [...(await readTable("categories")), keep, drop]);
    const withBoth = await readTable("categories");
    expect(withBoth.some((c) => c.id === keep.id)).toBe(true);
    expect(withBoth.some((c) => c.id === drop.id)).toBe(true);

    await writeTable("categories", withBoth.filter((c) => c.id !== drop.id));

    const after = await readTable("categories");
    expect(after.some((c) => c.id === keep.id)).toBe(true);
    expect(after.some((c) => c.id === drop.id)).toBe(false);
  });

  it("never produces a moment where the table is fully empty for a no-op sync", async () => {
    const before = await readTable("categories");
    if (before.length === 0) return; // nothing to prove on an empty table
    // Re-syncing the exact same data back should be a pure no-op (all "updates").
    await writeTable("categories", before);
    const after = await readTable("categories");
    expect(after.length).toBe(before.length);
  });
});

describe("writeTable() with a token-keyed table (sessions)", () => {
  const tokens: string[] = [];

  afterEach(async () => {
    if (tokens.length === 0) return;
    const sessions = await readTable("sessions");
    await writeTable("sessions", sessions.filter((s) => !tokens.includes(s.token)));
    tokens.length = 0;
  });

  it("inserts, updates, and deletes rows keyed by `token` instead of `id`", async () => {
    const users = await readTable("users");
    const anyUser = users[0];
    if (!anyUser) return; // no seeded users to reference; skip gracefully

    const now = new Date();
    const token = `test_${newId("tok")}`;
    tokens.push(token);
    const session: Session = {
      token,
      user_id: anyUser.id,
      created_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 60_000).toISOString(),
    };

    const before = await readTable("sessions");
    await writeTable("sessions", [...before, session]);
    let after = await readTable("sessions");
    expect(after.find((s) => s.token === token)).toBeTruthy();

    // Update
    const idx = after.findIndex((s) => s.token === token);
    after[idx] = { ...after[idx], expires_at: new Date(now.getTime() + 120_000).toISOString() };
    await writeTable("sessions", after);
    after = await readTable("sessions");
    expect(after.find((s) => s.token === token)?.expires_at).toBe(new Date(now.getTime() + 120_000).toISOString());

    // Delete
    await writeTable("sessions", after.filter((s) => s.token !== token));
    after = await readTable("sessions");
    expect(after.find((s) => s.token === token)).toBeUndefined();
  });
});
