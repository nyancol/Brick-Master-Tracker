export interface User {
  id: number;
  sub: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: number;
}

export interface SessionUser {
  id: number;
  email: string;
}

export interface BrickState {
  color: "red" | "blue";
  holderId: number;
  holderName: string;
  holderAvatarUrl: string | null;
  updatedAt: string;
}

export interface Transfer {
  id: number;
  color: "red" | "blue";
  fromId: number;
  fromName: string;
  toId: number;
  toName: string;
  transferredById: number;
  transferredByName: string;
  transferredAt: string;
}