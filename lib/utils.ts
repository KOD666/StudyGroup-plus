import crypto from "crypto";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateGroupCode(length = 6): string {
  let code = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    const byte = randomBytes[i] ?? 0;
    code += CODE_CHARS[byte % CODE_CHARS.length];
  }
  return code;
}

/**
 * Validates whether a given string is a valid YouTube URL.
 * Supports standard watch, short (youtu.be), live, embed, channel, and playlist URLs.
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    const isYouTubeDomain =
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "music.youtube.com" ||
      hostname === "gaming.youtube.com" ||
      hostname === "youtu.be" ||
      hostname === "www.youtu.be";

    if (!isYouTubeDomain) {
      return false;
    }

    if (hostname.endsWith("youtu.be")) {
      return parsed.pathname.length > 1;
    }

    return true;
  } catch {
    return false;
  }
}
