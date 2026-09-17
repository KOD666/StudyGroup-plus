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
