import { createHash, randomBytes } from "node:crypto";

export function hashAgentToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateAgentToken() {
  const token = `tr_${randomBytes(32).toString("hex")}`;
  return { token, tokenHash: hashAgentToken(token) };
}

export function readBearerToken(header: string | null) {
  const match = /^Bearer (tr_[a-f0-9]{64})$/i.exec(header ?? "");
  return match?.[1] ?? null;
}
