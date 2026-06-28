/**
 * Any alive cell with less than 2 neighbors dies from under population
 * Any alive cell with 2-3 neighbors stays alive
 * Any alive cell with more than 3 neighbors dies from over population
 * Any dead cell with exactly 3 neighbors revives
 */

import { describe, expect, it } from '@jest/globals';

const CellStatus = {
  alive: 'alive',
  dead: 'dead',
} as const;
type CellStatus = (typeof CellStatus)[keyof typeof CellStatus];

class Cell {
  private status: CellStatus;

  private constructor(status: CellStatus) {
    this.status = status;
  }

  public static alive() {
    return new Cell(CellStatus.alive);
  }

  public static dead() {
    return new Cell(CellStatus.dead);
  }

  isAlive() {
    return this.status === CellStatus.alive;
  }

  die() {
    this.status = CellStatus.dead;
  }

  revive() {
    this.status = CellStatus.alive;
  }
}

type Coord = [x: number, y: number];

class Grid {
  private used = new WeakSet<Cell>();
  private grid = new Map<string, Cell>();

  place(coord: Coord, cell: Cell) {
    if (this.isOccupied(coord)) {
      throw new Error();
    }
    if (this.isUsed(cell)) {
      throw new Error();
    }
    this.use(cell);
    this.grid.set(coord.toString(), cell);
  }

  private use(cell: Cell) {
    this.used.add(cell);
  }

  private isUsed(cell: Cell) {
    return this.used.has(cell);
  }

  private isOccupied(coord: Coord) {
    return this.grid.has(coord.toString());
  }

  at(coord: Coord) {
    return this.grid.get(coord.toString());
  }

  adjacent([x, y]: Coord) {
    // prettier-ignore
    const masks: Coord[] = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0],          [1,  0],
      [-1,  1], [0,  1], [1,  1],
    ];
    return masks.map(([maskX, maskY]) => this.at([x + maskX, y + maskY])).filter(Boolean) as Cell[];
  }
}

describe('The game of life', () => {
  describe('grid', () => {
    it('can place and retrieve cells', () => {
      const grid = new Grid();
      const coord = [0, 0] as Coord;
      const cell = Cell.alive();
      grid.place(coord, cell);
      expect(grid.at(coord)).toBe(cell);
    });
    it('cannot place the same cell in different cords', () => {
      const grid = new Grid();
      const cell = Cell.alive();
      grid.place([0, 0], cell);
      expect(() => grid.place([0, 1], cell)).toThrow();
    });
    it('cannot place a cell in an occupied coord', () => {
      const grid = new Grid();
      grid.place([0, 0], Cell.alive());
      expect(() => grid.place([0, 0], Cell.alive())).toThrow();
    });
    it('can have empty cells', () => {
      const grid = new Grid();
      expect(grid.at([0, 0])).toBeUndefined();
    });
    it('can find adjacent cells', () => {
      const grid = new Grid();
      const centerCoord = [0, 0] as Coord;
      const coords: Coord[] = [centerCoord, [1, 0], [0, 1], [1, 1]];
      coords.forEach((coord) => grid.place(coord, Cell.alive()));

      const centerCell = grid.at(centerCoord);
      const adjacent = grid.adjacent(centerCoord);

      // TODO: test with non-adjacent cells and check only adjacent are returned
      expect(centerCell).toBeDefined();
      expect(adjacent).not.toContain(centerCell);
      expect(new Set(adjacent).size).toBe(3);
    });
  });
  describe('cells', () => {
    it('can be alive', () => {
      const cell = Cell.alive();
      expect(cell.isAlive()).toBe(true);
    });
    it('can be dead', () => {
      const cell = Cell.dead();
      expect(cell.isAlive()).toBe(false);
    });
    it('can die', () => {
      const cell = Cell.alive();
      cell.die();
      expect(cell.isAlive()).toBe(false);
    });
    it('can revive', () => {
      const cell = Cell.dead();
      cell.revive();
      expect(cell.isAlive()).toBe(true);
    });
  });
});
