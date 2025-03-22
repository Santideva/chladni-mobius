// src/geometry/gridGenerator.js
import { stateStore } from '../state.js';
import { getGridCell } from './gridCellFactory.js';
import { hilbertIndex } from './hilbert.js';

/**
 * Generates a grid of flyweight grid cells, sorted by Hilbert order.
 * Dimensions are taken from stateStore.
 * @returns {Array} An array of GridCell objects, sorted by Hilbert index.
 */
export function generateGrid() {
  const rows = stateStore.grid.rows;
  const cols = stateStore.grid.cols;
  const grid = [];

  // Create the grid cells using the flyweight factory.
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      grid.push(getGridCell(x, y));
    }
  }

  // If the grid is square and its size is a power of 2, sort by Hilbert order.
  if (rows === cols && (rows & (rows - 1)) === 0) {
    grid.sort((cellA, cellB) => {
      const indexA = hilbertIndex(rows, cellA.baseX, cellA.baseY);
      const indexB = hilbertIndex(rows, cellB.baseX, cellB.baseY);
      return indexA - indexB;
    });
  }
  return grid;
}
