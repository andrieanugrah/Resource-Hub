import { describe, it, expect } from "vitest";
import { can } from "@/lib/permissions";
import type { Role } from "@/lib/db";

describe("can() permissions", () => {
  it("super_admin can do everything", () => {
    expect(can("super_admin", "asset.create")).toBe(true);
    expect(can("super_admin", "asset.delete")).toBe(true);
    expect(can("super_admin", "user.manage")).toBe(true);
    expect(can("super_admin", "master.manage")).toBe(true);
    expect(can("super_admin", "audit.view")).toBe(true);
    expect(can("super_admin", "request.approve")).toBe(true);
  });

  it("admin_it cannot manage users or view audit", () => {
    expect(can("admin_it", "user.manage")).toBe(false);
    expect(can("admin_it", "audit.view")).toBe(false);
    expect(can("admin_it", "asset.create")).toBe(true);
  });

  it("manager can approve requests but not create assets", () => {
    expect(can("manager", "request.approve")).toBe(true);
    expect(can("manager", "request.submit")).toBe(true);
    expect(can("manager", "asset.create")).toBe(false);
    expect(can("manager", "user.manage")).toBe(false);
  });

  it("employee can only submit requests and view", () => {
    expect(can("employee", "request.submit")).toBe(true);
    expect(can("employee", "asset.view")).toBe(false); // only super_admin/admin_it/manager
    expect(can("employee", "asset.create")).toBe(false);
    expect(can("employee", "request.approve")).toBe(false);
    expect(can("employee", "master.manage")).toBe(false);
    expect(can("employee", "user.manage")).toBe(false);
  });

  it("unknown action returns false", () => {
    expect(can("super_admin", "nonexistent.action")).toBe(false);
    expect(can("employee", "nonexistent.action")).toBe(false);
  });
});