/**
 * Converts a slider value (0-100) to a CRF value for ffmpeg.
 * @param {number} quality - The quality value from the slider (0-100).
 * @param {number} bestCrf - CRF at quality 100 (defaults to the x264 range).
 * @param {number} worstCrf - CRF at quality 0.
 * @returns {number} - The corresponding CRF value.
 */
export const qualityToCrf = (
  quality: number,
  bestCrf = 23,
  worstCrf = 51
): number => {
  const clampedQuality = Math.min(Math.max(quality, 0), 100);
  const crf = worstCrf - (clampedQuality / 100) * (worstCrf - bestCrf);
  return Math.round(crf);
};
