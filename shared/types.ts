export interface User {
  id: number;
  sub: string;
  email: string;
  displayName: string;
  username: string;
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

export interface TransferStory {
  description: string;
  editedBy: number;
  editedByName: string;
  editedAt: string;
}

export interface TransferImage {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  uploadedAt: string;
}