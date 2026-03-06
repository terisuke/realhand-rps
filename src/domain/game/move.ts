export type MoveType = "rock" | "paper" | "scissors";

export const MOVES: MoveType[] = ["rock", "paper", "scissors"];

/**
 * BEATS[x] = the move that beats x.
 * e.g. BEATS["rock"] = "paper" means paper beats rock.
 */
export const BEATS: Record<MoveType, MoveType> = {
  rock: "paper",
  paper: "scissors",
  scissors: "rock",
};

export const JP_LABELS: Record<MoveType, string> = {
  rock: "グー",
  paper: "パー",
  scissors: "チョキ",
};

export class Move {
  private constructor(public readonly type: MoveType) {}

  static of(type: MoveType): Move {
    if (!MOVES.includes(type)) {
      throw new Error(`Invalid move type: ${type}`);
    }
    return new Move(type);
  }

  static random(): Move {
    return new Move(MOVES[Math.floor(Math.random() * MOVES.length)]);
  }

  /** Returns the move that beats the given move */
  static counter(move: Move): Move {
    return new Move(BEATS[move.type]);
  }

  /** Returns true when this move beats other */
  beats(other: Move): boolean {
    return BEATS[other.type] === this.type;
  }

  /** Returns true when this move loses to other */
  losesTo(other: Move): boolean {
    return BEATS[this.type] === other.type;
  }

  jpLabel(): string {
    return JP_LABELS[this.type];
  }

  equals(other: Move): boolean {
    return this.type === other.type;
  }
}
