import { describe, expect, it } from '@jest/globals';

type FrameType = 'ongoing' | 'normal' | 'spare' | 'strike' | 'last';

class RollPins {
  public static readonly min = 0;
  public static readonly max = 10;

  private pins: number;

  public static create(pins: number) {
    if (pins < RollPins.min || RollPins.max < pins) throw new Error();
    return new RollPins(pins);
  }

  value() {
    return this.pins;
  }

  private constructor(pins: number) {
    this.pins = pins;
  }
}

class Frame {
  protected maxSize = 2;
  private rolls: RollPins[] = [];

  roll(pins: RollPins) {
    this.assertRoll(pins);
    this.rolls.push(pins);
  }

  isComplete() {
    return this.maxPinAmountForNextRoll() === RollPins.min;
  }

  type(): FrameType {
    if (!this.isComplete()) {
      return 'ongoing';
    }
    if (this.rolledPins() < RollPins.max) {
      return 'normal';
    }
    return this.isMaxSize() ? 'spare' : 'strike';
  }

  protected maxPinAmountForNextRoll() {
    if (this.isMaxSize()) return RollPins.min;
    return RollPins.max - this.rolledPins();
  }

  protected isMaxSize() {
    return this.size() === this.maxSize;
  }

  protected size() {
    return this.rolls.length;
  }

  private assertRoll(pins: RollPins) {
    if (this.maxPinAmountForNextRoll() < pins.value()) {
      throw new Error();
    }
  }

  private rolledPinsAt(index: number) {
    return this.rolls.at(index)?.value();
  }

  firstRollPins() {
    return this.rolledPinsAt(0);
  }

  secondRollPins() {
    return this.rolledPinsAt(1);
  }

  rolledPins() {
    return this.rolls.reduce((total, roll) => total + roll.value(), 0);
  }
}

class LastFrame extends Frame {
  protected override maxSize = 3;

  protected override maxPinAmountForNextRoll() {
    if (this.isMaxSize()) return RollPins.min;
    if (this.size() === 0) return RollPins.max;
    if (this.size() === 1) {
      return RollPins.max - this.rolledPins() || RollPins.max;
    }
    if (this.rolledPins() < RollPins.max) {
      return RollPins.min;
    }
    return RollPins.max - (this.rolledPins() % RollPins.max);
  }

  override type() {
    return 'last' as const;
  }
}

class BowlingGame {
  private static amountOfFrames = 10;
  private frames: Frame[];

  constructor() {
    this.frames = Array.from({ length: BowlingGame.amountOfFrames - 1 }, () => new Frame());
    this.frames.push(new LastFrame());
  }

  roll(pins: number) {
    const currentFrame = this.currentFrame();
    if (!currentFrame) {
      throw new Error();
    }
    currentFrame.roll(RollPins.create(pins));
  }

  private currentFrame() {
    return this.frames.find((frame) => !frame.isComplete());
  }

  private isFinished() {
    return this.frames.every((frame) => frame.isComplete());
  }

  calculateTotalScore() {
    if (!this.isFinished()) {
      throw new Error();
    }
    return this.frames.reduce((score, frame, index) => score + this.calculateScoreForFrameAt(index), 0);
  }

  private calculateScoreForFrameAt(index: number) {
    const frame = this.frames.at(index);
    switch (frame?.type()) {
      case 'normal':
        return frame.rolledPins();
      case 'spare':
        return frame.rolledPins() + (this.frames.at(index + 1)?.firstRollPins() ?? 0);
      case 'strike':
        return (
          frame.rolledPins() +
          (this.frames.at(index + 1)?.firstRollPins() ?? 0) +
          (this.frames.at(index + 1)?.secondRollPins() ?? this.frames.at(index + 2)?.firstRollPins() ?? 0)
        );
      case 'last':
        return frame.rolledPins();
      default:
        return 0;
    }
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
    rollMany(game, 16, 0);
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

  it('should be able to calculate the total score for the perfect game', () => {
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

  it('should not be able to roll more than 10 pins in the same frame', () => {
    const game = new BowlingGame();
    game.roll(5);
    expect(() => game.roll(6)).toThrow();
  });
});

function rollMany(game: BowlingGame, times: number, pins: number) {
  Array.from({ length: times }).forEach(() => game.roll(pins));
}
