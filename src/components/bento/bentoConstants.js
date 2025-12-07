/**
 * Costanti per il sistema Bento Box
 */

// Preset altezze per i box
export const HEIGHT_PRESETS = {
  sm: 100,
  md: 200,
  lg: 300,
  xl: 400,
};

/**
 * Converte altezza da preset o numero a pixel
 * @param {number|string} height
 * @returns {number}
 */
export const resolveHeight = (height) => {
  if (typeof height === "number") return height;
  if (typeof height === "string" && HEIGHT_PRESETS[height]) {
    return HEIGHT_PRESETS[height];
  }
  // Default
  return HEIGHT_PRESETS.md;
};
