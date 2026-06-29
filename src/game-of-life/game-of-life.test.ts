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

type Coord = readonly [x: number, y: number];

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
    return this.grid.has(this.serializeCoord(coord));
  }

  at(coord: Coord) {
    return this.grid.get(this.serializeCoord(coord));
  }

  adjacentOf(coord: Coord) {
    return this.adjacentCoordsOf(coord).map((coord) => this.entry(coord));
  }

  private adjacentCoordsOf([x, y]: Coord) {
    // prettier-ignore
    const deltas = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0],          [1,  0],
      [-1,  1], [0,  1], [1,  1],
    ];
    return deltas.map(([dX, dY]) => [x + dX, y + dY] as const);
  }

  entries() {
    return this.occupiedCoords().map((coord) => this.entry(coord)) as Array<[Coord, Cell]>;
  }

  private entry(coord: Coord) {
    return [coord, this.at(coord)] as const;
  }

  private occupiedCoords() {
    return Array.from(this.grid.keys()).map((key) => this.parseCoord(key));
  }

  private serializeCoord(coord: Coord) {
    return String(coord);
  }

  private parseCoord(string: string) {
    const [x, y] = string.split(',').map(Number);
    return [x, y] as const;
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
      // prettier-ignore
      const adjacentEntries = ([
        [-1, -1], [0, -1], [1, -1],
        [-1,  0],          [1,  0],
        [-1,  1], [0,  1], [1,  1],
      ] as Coord[]).map((coord) => [coord, Cell.alive()] as const);
      const center = [0, 0] as Coord;
      const cellAtCenter = Cell.alive();
      const centerEntry = [center, cellAtCenter] as const;
      const outlier = [2, 2] as Coord;
      const outlierCell = Cell.alive();
      const outlierEntry = [outlier, outlierCell] as const;
      [...adjacentEntries, centerEntry, outlierEntry].forEach((entry) => grid.place(...entry));

      const adjacent = grid.adjacentOf(center);
      expect(adjacent).toStrictEqual(adjacentEntries);
      expect(adjacent).not.toContainEqual(centerEntry);
      expect(adjacent).not.toContainEqual(outlierEntry);
    });
    it('can list occupied entries', () => {
      const grid = new Grid();
      const entries: Array<[Coord, Cell]> = [
        [[0, 1], Cell.alive()],
        [[1, 2], Cell.alive()],
        [[2, 3], Cell.alive()],
        [[3, 4], Cell.alive()],
      ];
      entries.forEach(([coord, cell]) => grid.place(coord, cell));
      expect(grid.entries()).toEqual(entries);
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
