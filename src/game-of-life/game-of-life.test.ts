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
    return this;
  }

  revive() {
    this.status = CellStatus.alive;
    return this;
  }
}

type CoordString = `${number}|${number}`;

class Coord {
  readonly x: number;
  readonly y: number;

  private static readonly separator = '|';

  private constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static at(x: number, y: number) {
    return new Coord(x, y);
  }

  static origin() {
    return new Coord(0, 0);
  }

  static fromString(string: CoordString) {
    const [x, y] = string.split(Coord.separator).map(Number);
    return Coord.at(x, y);
  }

  add(coord: Coord) {
    return new Coord(this.x + coord.x, this.y + coord.y);
  }

  toString(): CoordString {
    return `${this.x}${Coord.separator}${this.y}`;
  }
}

class Grid<TItem> {
  private grid = new Map<CoordString, TItem>();

  place(coord: Coord, item: TItem) {
    if (this.isOccupied(coord)) {
      throw new Error();
    }
    this.grid.set(coord.toString(), item);
  }

  placeIfEmpty(coord: Coord, item: TItem) {
    return this.at(coord) ?? (this.place(coord, item), item);
  }

  remove(coord: Coord) {
    this.grid.delete(coord.toString());
  }

  isOccupied(coord: Coord) {
    return this.grid.has(coord.toString());
  }

  at(coord: Coord) {
    return this.grid.get(coord.toString());
  }

  adjacentOf(coord: Coord) {
    return this.adjacentCoordsOf(coord).map((coord) => [coord, this.at(coord)] as const);
  }

  adjacentCoordsOf(coord: Coord) {
    // prettier-ignore
    const deltas = [
      Coord.at(-1, -1), Coord.at(0, -1), Coord.at(1, -1),
      Coord.at(-1,  0),                  Coord.at(1,  0),
      Coord.at(-1,  1), Coord.at(0,  1), Coord.at(1,  1),
    ];
    return deltas.map((delta) => coord.add(delta));
  }

  occupiedCoords() {
    return Array.from(this.grid.keys()).map(Coord.fromString);
  }
}

class Game {
  private readonly grid = new Grid<Cell>();

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
      const grid = new Grid<Cell>();
      const coord = Coord.origin();
      const cell = Cell.alive();
      grid.place(coord, cell);
      expect(grid.at(coord)).toBe(cell);
    });
    it('cannot place a cell in an occupied coord', () => {
      const grid = new Grid<Cell>();
      const coord = Coord.origin();
      grid.place(coord, Cell.alive());
      expect(() => grid.place(coord, Cell.alive())).toThrow();
    });
    it('can have empty cells', () => {
      const grid = new Grid<Cell>();
      expect(grid.at(Coord.origin())).toBeUndefined();
    });
    it('can find adjacent cells', () => {
      const grid = new Grid<Cell>();
      // prettier-ignore
      const adjacentEntries = ([
        Coord.at(-1, -1), Coord.at(0, -1), Coord.at(1, -1),
        Coord.at(-1,  0),                  Coord.at(1,  0),
        Coord.at(-1,  1), Coord.at(0,  1), Coord.at(1,  1),
      ] as Coord[]).map((coord) => [coord, Cell.alive()] as const);
      const center = Coord.origin();
      const cellAtCenter = Cell.alive();
      const centerEntry = [center, cellAtCenter] as const;
      const outlier = Coord.at(2, 2);
      const outlierCell = Cell.alive();
      const outlierEntry = [outlier, outlierCell] as const;
      [...adjacentEntries, centerEntry, outlierEntry].forEach((entry) => grid.place(...entry));

      const adjacent = grid.adjacentOf(center);
      expect(adjacent).toStrictEqual(adjacentEntries);
      expect(adjacent).not.toContainEqual(centerEntry);
      expect(adjacent).not.toContainEqual(outlierEntry);
    });
  });
  describe('coord', () => {
    it('creates the origin at (0, 0)', () => {
      const origin = Coord.origin();
      expect(origin).toEqual(Coord.at(0, 0));
    });
    it('adds two coordinates', () => {
      const coord = Coord.at(1, 2);
      const result = coord.add(Coord.at(1, 1));
      expect(result).toEqual(Coord.at(2, 3));
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
    return [Coord.at(x, y), status] as [Coord, CellStatus];
  });
  return new Game(initialState);
}

function nextStateCenterCell(game: Game) {
  const center = Coord.at(1, 1);
  return game.next().at(center);
}
