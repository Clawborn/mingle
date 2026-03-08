// Input sanitization & validation for Clawborn
// Prevents prompt injection and data leakage

/**
 * Strip prompt-injection patterns from user input before feeding to LLM.
 * Removes common jailbreak/override patterns while keeping normal text intact.
 */
export function sanitizeForPrompt(input: string, maxLength = 200): string {
  if (!input || typeof input !== "string") return "";

  let clean = input.slice(0, maxLength);

  // Strip common injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+(instructions?|prompts?|rules?)/gi,
    /forget\s+(all\s+)?(your\s+)?(instructions?|rules?|prompts?)/gi,
    /you\s+are\s+now\s+/gi,
    /new\s+instruction[s:]?\s*/gi,
    /system\s*:\s*/gi,
    /\[system\]/gi,
    /\[INST\]/gi,
    /<<SYS>>/gi,
    /<\|im_start\|>/gi,
    /\bact\s+as\b/gi,
    /\brole\s*play\s+as\b/gi,
    /\bpretend\s+(you\s+are|to\s+be)\b/gi,
    /\bdo\s+not\s+follow\b/gi,
    /\boverride\b/gi,
    /```[\s\S]*?```/g,  // Strip code blocks (often used to hide instructions)
    /\bforward\s+(all\s+)?emails?\b/gi,
    /\bread\s+(my\s+|the\s+)?(email|inbox|messages?|contacts?|files?)\b/gi,
    /\bsend\s+(to|email|message)\b/gi,
    /\bexecute\s+(code|command|script)\b/gi,
    /\bfetch\s+https?:\/\//gi,
    /\bcurl\s+/gi,
  ];

  for (const pattern of injectionPatterns) {
    clean = clean.replace(pattern, "[filtered]");
  }

  // Remove control characters
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return clean.trim();
}

/**
 * Validate and sanitize registration data
 */
export interface RegisterInput {
  name: string;
  bio: string;
  agent_name?: string;
  avatar?: string;
  interests?: string[];
  looking_for?: string;
  socials?: Record<string, string>;
  agent_api_endpoint?: string;
  agent_token?: string;
}

export interface SanitizedRegisterInput {
  name: string;
  bio: string;
  agent_name: string;
  avatar: string;
  interests: string[];
  looking_for: string;
  socials: Record<string, string>;
  agent_api_endpoint?: string;
  agent_token?: string;
}

const ALLOWED_SOCIAL_KEYS = new Set([
  "wechat", "twitter", "telegram", "discord", "weibo",
  "xiaohongshu", "feishu", "github", "linkedin", "email",
]);

const AVATAR_RE = /^[\p{Emoji}\p{Emoji_Component}]{1,4}$/u;

export function validateRegisterInput(body: unknown): { ok: true; data: SanitizedRegisterInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "请求体必须是 JSON 对象" };
  }

  const b = body as Record<string, unknown>;

  // Required fields
  if (!b.name || typeof b.name !== "string" || b.name.trim().length === 0) {
    return { ok: false, error: "name 是必填项" };
  }
  if (!b.bio || typeof b.bio !== "string" || b.bio.trim().length === 0) {
    return { ok: false, error: "bio 是必填项" };
  }

  const name = b.name.toString().trim().slice(0, 50);
  const bio = b.bio.toString().trim().slice(0, 200);

  // Validate name (no special chars that could break prompts)
  if (/[<>{}[\]\\|`]/.test(name)) {
    return { ok: false, error: "name 包含非法字符" };
  }

  // Avatar
  let avatar = "🤖";
  if (typeof b.avatar === "string" && AVATAR_RE.test(b.avatar.trim())) {
    avatar = b.avatar.trim();
  }

  // Agent name
  const agent_name = typeof b.agent_name === "string"
    ? b.agent_name.trim().slice(0, 50)
    : `${name}'s Agent`;

  // Interests
  let interests: string[] = [];
  if (Array.isArray(b.interests)) {
    interests = b.interests
      .filter((i): i is string => typeof i === "string")
      .map(i => i.trim().slice(0, 30))
      .slice(0, 10);
  }

  // Looking for
  const looking_for = typeof b.looking_for === "string"
    ? b.looking_for.trim().slice(0, 200)
    : "";

  // Socials — whitelist keys, validate values
  const socials: Record<string, string> = {};
  if (b.socials && typeof b.socials === "object" && !Array.isArray(b.socials)) {
    for (const [key, val] of Object.entries(b.socials as Record<string, unknown>)) {
      if (!ALLOWED_SOCIAL_KEYS.has(key)) continue;
      if (typeof val !== "string") continue;
      const cleanVal = val.trim().slice(0, 100);
      // Basic URL/handle validation — no script injection
      if (/[<>{}]/.test(cleanVal)) continue;
      socials[key] = cleanVal;
    }
  }

  // Agent API endpoint — must be https
  let agent_api_endpoint: string | undefined;
  if (typeof b.agent_api_endpoint === "string") {
    const url = b.agent_api_endpoint.trim();
    if (url.startsWith("https://") && url.length < 500) {
      agent_api_endpoint = url;
    }
  }

  return {
    ok: true,
    data: { name, bio, agent_name, avatar, interests, looking_for, socials, agent_api_endpoint },
  };
}

/**
 * Redact socials for public display (show only that they exist, not values)
 */
export function redactSocials(socials: Record<string, string> | null): Record<string, boolean> {
  if (!socials) return {};
  const result: Record<string, boolean> = {};
  for (const key of Object.keys(socials)) {
    result[key] = true;
  }
  return result;
}

/**
 * Sanitize arena move input
 */
export function sanitizeMove(moveName: string, moveDesc: string): { move_name: string; move_description: string } {
  return {
    move_name: sanitizeForPrompt(moveName, 50),
    move_description: sanitizeForPrompt(moveDesc, 300),
  };
}

/**
 * Sanitize roast line input
 */
export function sanitizeRoastLine(line: string): string {
  return sanitizeForPrompt(line, 500);
}
