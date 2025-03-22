// src/geometry/gridCellFactory.js
import { GridCell } from './gridCell.js';

// A cache to hold and share GridCell instances by key "x,y".
const cellCache = new Map();

/**
 * Returns a flyweight GridCell for the given (x, y) coordinates.
 * @param {number} x - The x-coordinate.
 * @param {number} y - The y-coordinate.
 * @returns {GridCell} A GridCell instance.
 */
export function getGridCell(x, y) {
  const key = `${x},${y}`;
  if (!cellCache.has(key)) {
    cellCache.set(key, new GridCell(x, y));
  }
  return cellCache.get(key);
}
