import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("can hash and verify a password", () => {
    const { hash, salt } = hashPassword("test123");
    expect(hash).toHaveLength(128);
    expect(salt).toHaveLength(32);
    expect(verifyPassword("test123", hash, salt)).toBe(true);
  });

  it("rejects wrong password", () => {
    const { hash, salt } = hashPassword("correct");
    expect(verifyPassword("wrong", hash, salt)).toBe(false);
  });

  it("produces different hashes for same password", () => {
    const a = hashPassword("same");
    const b = hashPassword("same");
    expect(a.hash).not.toBe(b.hash);
    expect(verifyPassword("same", a.hash, a.salt)).toBe(true);
    expect(verifyPassword("same", b.hash, b.salt)).toBe(true);
  });

  it("fails on length mismatch (timing-safe)", () => {
    const { hash, salt } = hashPassword("pwd");
    const fakeSalt = "ab".repeat(8);
    expect(verifyPassword("pwd", hash, fakeSalt)).toBe(false);
  });
});