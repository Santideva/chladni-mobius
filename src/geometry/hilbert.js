// src/geometry/hilbert.js

/**
 * Computes the Hilbert order index for coordinates (x, y) on a grid of size n x n.
 * Note: n must be a power of 2.
 *
 * @param {number} n - The dimension of the grid (must be a power of 2).
 * @param {number} x - The x-coordinate.
 * @param {number} y - The y-coordinate.
 * @returns {number} The Hilbert index.
 */
export function hilbertIndex(n, x, y) {
    let index = 0;
    for (let s = n >> 1; s > 0; s = s >> 1) {
      const rx = (x & s) > 0 ? 1 : 0;
      const ry = (y & s) > 0 ? 1 : 0;
      index += s * s * ((3 * rx) ^ ry);
      // Rotate
      if (ry === 0) {
        if (rx === 1) {
          x = n - 1 - x;
          y = n - 1 - y;
        }
        // Swap x and y
        [x, y] = [y, x];
      }
    }
    return index;
  }
  