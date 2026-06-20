import { describe, expect, it } from '@jest/globals';

class BowlingGame {
  private rolls: number[] = [];

  roll(pins: number) {
    this.rolls.push(pins);
  }

  calculateTotalScore() {
    return this.rolls.reduce((total, roll) => total + roll, 0);
  }
}

describe('bowling game', () => {
  it('should be able to calculate the total score for the worst game', () => {
    const game = new BowlingGame();
    rollMany(game, 20, 0);
    expect(game.calculateTotalScore()).toBe(0);
  });

  it('should be able to calculate the total score for game with all ones', () => {
    const game = new BowlingGame();
    rollMany(game, 20, 1);
    expect(game.calculateTotalScore()).toBe(20);
  });
});

function rollMany(game: BowlingGame, times: number, pins: number) {
  Array.from({ length: times }).forEach(() => game.roll(pins));
}
