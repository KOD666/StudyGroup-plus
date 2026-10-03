/**
 * Small palette of accessible cursor colors.
 */
export const CURSOR_PALETTE = [
  "#2563eb", // Royal blue
  "#059669", // Emerald
  "#d97706", // Amber
  "#7c3aed", // Violet
  "#db2777", // Pink
  "#0891b2", // Cyan
  "#ea580c", // Orange
  "#4f46e5", // Indigo
];

/**
 * Deterministically maps any participant identity string to a fixed palette color.
 */
export function getParticipantCursorColor(identity: string): string {
  if (!identity) return CURSOR_PALETTE[0] ?? "#2563eb";
  let hash = 0;
  for (let i = 0; i < identity.length; i++) {
    hash = (hash << 5) - hash + identity.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CURSOR_PALETTE.length;
  return CURSOR_PALETTE[index] ?? CURSOR_PALETTE[0] ?? "#2563eb";
}
