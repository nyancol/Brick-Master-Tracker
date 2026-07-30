export type BrickColor = "red" | "blue";

export interface BrickState {
  color: BrickColor;
  holder: string;
  updatedAt: string;
}

export interface Transfer {
  id: number;
  color: BrickColor;
  fromHolder: string;
  toHolder: string;
  transferredAt: string;
}

export interface TransferInput {
  to: string;
}