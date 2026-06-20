import { describe, expect, it } from '@jest/globals';

type Frame = {
  startsAt: number;
  type: 'normal' | 'spare' | 'strike' | 'last';
};

class BowlingGame {
  private rolls: number[] = [];

  roll(pins: number) {
    this.assertRoll(pins);
    this.rolls.push(pins);
  }

  private assertRoll(pins: number) {
    if (pins < 0 || 10 < pins) throw new Error();
  }

  calculateTotalScore() {
    return this.frames().reduce((total, frame) => total + this.calculateFrameScore(frame), 0);
  }

  calculateFrameScore({ startsAt, type }: Frame) {
    const firstRoll = this.getPinsAt(startsAt);
    const secondRoll = this.getPinsAt(startsAt + 1);
    const thirdRoll = type === 'normal' ? 0 : this.getPinsAt(startsAt + 2);
    return firstRoll + secondRoll + thirdRoll;
  }

  private getPinsAt(rollIndex: number) {
    return this.rolls.at(rollIndex) ?? 0;
  }

  frames(): Frame[] {
    const framesInGame = 10;
    const pinsInFrame = 10;
    let startsAt = 0;
    let nthFrame = 1;
    return Array.from({ length: framesInGame }, () => {
      const firstRoll = this.getPinsAt(startsAt);
      const secondRoll = this.getPinsAt(startsAt + 1);
      // prettier-ignore
      const type =
        nthFrame               === framesInGame ? 'last'   :
        firstRoll              === pinsInFrame  ? 'strike' :
        firstRoll + secondRoll === pinsInFrame  ? 'spare'  : 'normal';
      const size = type === 'strike' ? 1 : 2;
      const frame = { startsAt, type } as const;
      startsAt += size;
      nthFrame += 1;
      return frame;
    });
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

  it('should be able to calculate the total score for a game with all spares', () => {
    const game = new BowlingGame();
    rollMany(game, 21, 5);
    expect(game.calculateTotalScore()).toBe(150);
  });

  it('should be able to calculate the total score for a game with a strike and two normal rolls', () => {
    const game = new BowlingGame();
    game.roll(10);
    rollMany(game, 2, 4);
    rollMany(game, 17, 0);
    expect(game.calculateTotalScore()).toBe(26);
  });

  it('should be able to calculate the total score for a game with two strikes in a row and two normal rolls', () => {
    const game = new BowlingGame();
    rollMany(game, 2, 10);
    rollMany(game, 2, 4);
    rollMany(game, 14, 0);
    expect(game.calculateTotalScore()).toBe(50);
  });

  it('should be able to calculate the total score for a spare in the last frame', () => {
    const game = new BowlingGame();
    rollMany(game, 18, 0);
    rollMany(game, 3, 5);
    expect(game.calculateTotalScore()).toBe(15);
  });

  it('should be able to calculate the total score for a strike in the last frame', () => {
    const game = new BowlingGame();
    rollMany(game, 18, 0);
    game.roll(10);
    rollMany(game, 2, 5);
    expect(game.calculateTotalScore()).toBe(20);
  });

  it('should be able to calculate the total score for the best game', () => {
    const game = new BowlingGame();
    rollMany(game, 12, 10);
    expect(game.calculateTotalScore()).toBe(300);
  });

  it('should not be able to roll a negative pin amount', () => {
    const game = new BowlingGame();
    expect(() => game.roll(-1)).toThrow();
  });

  it('should not be able to roll more than 10 pins', () => {
    const game = new BowlingGame();
    expect(() => game.roll(11)).toThrow();
  });
});

function rollMany(game: BowlingGame, times: number, pins: number) {
  Array.from({ length: times }).forEach(() => game.roll(pins));
}
