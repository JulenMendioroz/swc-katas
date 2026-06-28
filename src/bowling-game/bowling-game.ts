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
export class BowlingGame {
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
    return this.frames.reduce((score, _frame, index) => score + this.calculateScoreForFrameAt(index), 0);
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
