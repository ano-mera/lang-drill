/**
 * Question selection utilities for random/sequential question navigation
 */

/**
 * Generate a cryptographically secure random index (with Math.random fallback)
 */
export const getSecureRandomIndex = (max: number): number => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }
  // Fallback: Math.random()
  return Math.floor(Math.random() * max);
};
