import { describe, expect, it } from '@jest/globals';

type Frame = {
  startsAt: number;
};

class BowlingGame {
  private rolls: number[] = [];

  roll(pins: number) {
    this.rolls.push(pins);
  }

  calculateTotalScore() {
    return this.frames().reduce((total, frame) => total + this.calculateFrameScore(frame), 0);
  }

  calculateFrameScore({ startsAt }: Frame) {
    const pinsInFrame = 10;
    const rolledPins = this.getPinsAt(startsAt) + this.getPinsAt(startsAt + 1);
    return rolledPins === pinsInFrame ? rolledPins + this.getPinsAt(startsAt + 2) : rolledPins;
  }

  private getPinsAt(rollIndex: number) {
    return this.rolls.at(rollIndex) ?? 0;
  }

  frames(): Frame[] {
    const framesInGame = 10;
    return Array.from({ length: framesInGame }, (_, i) => ({ startsAt: 2 * i }));
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

  it('should be able to calculate the total score for a game with a spare and an extra non-zero roll', () => {
    const game = new BowlingGame();
    rollMany(game, 3, 5);
    rollMany(game, 17, 0);
    expect(game.calculateTotalScore()).toBe(20);
  });

  it('should be able to calculate the total score for a game with two consecutive spares and an extra non-zero roll', () => {
    const game = new BowlingGame();
    rollMany(game, 5, 5);
    rollMany(game, 15, 0);
    expect(game.calculateTotalScore()).toBe(35);
  });
});

function rollMany(game: BowlingGame, times: number, pins: number) {
  Array.from({ length: times }).forEach(() => game.roll(pins));
}
