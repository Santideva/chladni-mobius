// src/geometry/GridCell.js
export class GridCell {
    constructor(x, y) {
      this.baseX = x; // intrinsic x-coordinate
      this.baseY = y; // intrinsic y-coordinate
    }
  
    /**
     * Returns the transformed position of the cell.
     * @param {Function} transformFn - A function that takes (x, y) and returns a transformed {x, y} object.
     * @returns {Object} The transformed position.
     */
    getTransformedPosition(transformFn) {
      return transformFn(this.baseX, this.baseY);
    }
  }
  