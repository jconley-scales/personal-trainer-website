// Very lightweight admin auth: a single shared password (set via
// ADMIN_PASSWORD) protects a login endpoint that hands back an opaque
// session token. Tokens live in memory only, so they're invalidated
// whenever the server restarts - intentionally simple for a small,
// single-trainer business site. For a multi-admin or production-hardened
// setup, swap this for real user accounts + hashed passwords + a proper
// session store.

import { randomUUID } from "node:crypto";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const sessions = new Map(); // token -> expiresAt

export function createSession() {
  const token = randomUUID();
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function isValid(token) {
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token || !isValid(token)) {
    return res.status(401).json({ error: "Not authorized. Please log in again." });
  }
  next();
}
