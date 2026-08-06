import crypto from "node:crypto";
const KEYLEN = 64;
const COST = 16384;
const BLOCK = 8;
const PARALLEL = 1;

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N: COST, r: BLOCK, p: PARALLEL }).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = crypto.scryptSync(password, salt, KEYLEN, { N: COST, r: BLOCK, p: PARALLEL });
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}
