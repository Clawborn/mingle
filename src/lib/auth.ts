import { randomBytes } from "crypto";

export function generateToken(): string {
  return "mingle_" + randomBytes(24).toString("base64url");
}

export function extractToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  return auth; // fallback: raw token
}
