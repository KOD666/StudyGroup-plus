/**
 * Pure coordinate conversion helpers for shared live cursors.
 * Normalized coordinates are fractions in the range [0, 1] relative to the document page.
 */

export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface PixelPoint {
  px: number;
  py: number;
}

/**
 * Converts mouse/pointer event coordinates relative to a container into clamped [0, 1] fractions.
 */
export function clientToFraction(
  clientX: number,
  clientY: number,
  rect: DOMRect
): NormalizedPoint {
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0, y: 0 };
  }

  const rawX = (clientX - rect.left) / rect.width;
  const rawY = (clientY - rect.top) / rect.height;

  const clampedX = Math.max(0, Math.min(1, rawX));
  const clampedY = Math.max(0, Math.min(1, rawY));

  // Round to 4 decimal places (~0.01% precision) to keep payloads small
  return {
    x: Math.round(clampedX * 10000) / 10000,
    y: Math.round(clampedY * 10000) / 10000,
  };
}

/**
 * Converts clamped [0, 1] fractions back into pixel offsets relative to a container.
 */
export function fractionToPixels(
  x: number,
  y: number,
  rect: DOMRect
): PixelPoint {
  const clampedX = Math.max(0, Math.min(1, x));
  const clampedY = Math.max(0, Math.min(1, y));

  return {
    px: clampedX * rect.width,
    py: clampedY * rect.height,
  };
}
