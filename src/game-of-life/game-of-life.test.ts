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

  public static create(status: CellStatus) {
    return new Cell(status);
  }

  public static alive() {
    return Cell.create(CellStatus.alive);
  }

  public static dead() {
    return Cell.create(CellStatus.dead);
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
  private grid = new Map<string, Cell>();

  place(coord: Coord, cell: Cell) {
    if (this.isOccupied(coord)) {
      throw new Error();
    }
    this.grid.set(coord.toString(), cell);
  }

  placeIfEmpty(coord: Coord, cell: Cell) {
    return this.at(coord) ?? (this.place(coord, cell), cell);
  }

  remove(coord: Coord) {
    this.grid.delete(this.serializeCoord(coord));
  }

  isOccupied(coord: Coord) {
    return this.grid.has(this.serializeCoord(coord));
  }

  at(coord: Coord) {
    return this.grid.get(this.serializeCoord(coord));
  }

  adjacentOf(coord: Coord) {
    return this.adjacentCoordsOf(coord).map((coord) => this.entry(coord));
  }

  adjacentCoordsOf([x, y]: Coord) {
    // prettier-ignore
    const deltas = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0],          [1,  0],
      [-1,  1], [0,  1], [1,  1],
    ];
    return deltas.map(([dX, dY]) => [x + dX, y + dY] as const);
  }

  private entry(coord: Coord) {
    return [coord, this.at(coord)] as const;
  }

  occupiedCoords() {
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

class Game {
  private readonly grid = new Grid();

  constructor(initialState: ReadonlyArray<[Coord, CellStatus]>) {
    initialState.forEach(([coord, status]) => this.grid.place(coord, Cell.create(status)));
  }

  next() {
    this.coordsToUpdate()
      .map((coord) => ({
        cell: this.grid.placeIfEmpty(coord, Cell.dead()),
        amountOfAliveNeighbors: this.amountOfAliveNeighborsAt(coord),
      }))
      .forEach(({ cell, amountOfAliveNeighbors }) => {
        switch (true) {
          case amountOfAliveNeighbors < 2: {
            return cell.die();
          }
          case amountOfAliveNeighbors === 2: {
            return;
          }
          case amountOfAliveNeighbors === 3: {
            return cell.revive();
          }
          case amountOfAliveNeighbors > 3: {
            return cell.die();
          }
        }
      });
    return this;
  }

  at(coord: Coord) {
    return this.grid.at(coord);
  }

  private amountOfAliveNeighborsAt(coord: Coord) {
    return this.grid.adjacentOf(coord).reduce((total, [, cell]) => total + Number(cell?.isAlive() ?? false), 0);
  }

  private coordsToUpdate() {
    const visited = new Set<string>();
    return this.grid.occupiedCoords().reduce((toUpdate, coord) => {
      [coord, ...this.grid.adjacentCoordsOf(coord)].forEach((coord) => {
        const coordStr = coord.toString();
        if (!visited.has(coordStr)) {
          visited.add(coordStr);
          toUpdate.push(coord);
        }
      });
      return toUpdate;
    }, [] as Coord[]);
  }
}

describe('The game of life', () => {
  describe('game', () => {
    it('kills any alive cell with less than 2 neighbors due to under population', () => {
      // prettier-ignore
      const cell = nextStateCenterCell(create3x3Game([
        CellStatus.dead, CellStatus.dead, CellStatus.dead,
        CellStatus.dead, CellStatus.alive, CellStatus.dead,
        CellStatus.dead, CellStatus.dead, CellStatus.dead,
      ]));
      expect(cell?.isAlive()).toBe(false);
    });
    it('keeps alive cells with 2 alive neighbors', () => {
      // prettier-ignore
      const cell = nextStateCenterCell(create3x3Game([
        CellStatus.dead, CellStatus.dead, CellStatus.dead,
        CellStatus.alive, CellStatus.alive, CellStatus.alive,
        CellStatus.dead, CellStatus.dead, CellStatus.dead,
      ]));
      expect(cell?.isAlive()).toBe(true);
    });
    it('keeps alive cells with 3 alive neighbors', () => {
      // prettier-ignore
      const cell = nextStateCenterCell(create3x3Game([
        CellStatus.alive, CellStatus.dead, CellStatus.alive,
        CellStatus.dead, CellStatus.alive, CellStatus.dead,
        CellStatus.dead, CellStatus.alive, CellStatus.dead,
      ]));
      expect(cell?.isAlive()).toBe(true);
    });
    it('kills alive cells with more than 3 alive neighbors due to over population', () => {
      // prettier-ignore
      const center = nextStateCenterCell(create3x3Game([
        CellStatus.dead, CellStatus.alive, CellStatus.dead,
        CellStatus.alive, CellStatus.alive, CellStatus.alive,
        CellStatus.dead, CellStatus.alive, CellStatus.dead,
      ]));
      expect(center?.isAlive()).toBe(false);
    });
    it('revives dead cells with exactly 3 alive neighbors', () => {
      // prettier-ignore
      const cell = nextStateCenterCell(create3x3Game([
        CellStatus.dead, CellStatus.alive, CellStatus.dead,
        CellStatus.dead, CellStatus.dead, CellStatus.dead,
        CellStatus.alive, CellStatus.dead, CellStatus.alive,
      ]));
      expect(cell?.isAlive()).toBe(true);
    });
  });
  describe('grid', () => {
    it('can place and retrieve cells', () => {
      const grid = new Grid();
      const coord = [0, 0] as Coord;
      const cell = Cell.alive();
      grid.place(coord, cell);
      expect(grid.at(coord)).toBe(cell);
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

function create3x3Game(config: CellStatus[]) {
  const size = 3;
  if (config.length !== size ** 2) throw new Error();
  const initialState = config.map((status, index) => {
    const x = index % size;
    const y = Math.floor(index / size);
    return [[x, y], status] as [Coord, CellStatus];
  });
  return new Game(initialState);
}

function nextStateCenterCell(game: Game) {
  const center = [1, 1] as const;
  return game.next().at(center);
}
