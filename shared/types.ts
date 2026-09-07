export type UserRole = "knight" | "visitor";

export type BrickColor = "red" | "blue";

export interface User {
  id: number;
  sub: string;
  email: string;
  displayName: string;
  username: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: number;
}

export interface SessionUser {
  id: number;
  email: string;
}

export interface BrickState {
  color: BrickColor;
  holderId: number | null;
  holderName: string;
  holderAvatarUrl: string | null;
  updatedAt: string;
}

export interface Transfer {
  id: number;
  color: BrickColor;
  fromId: number | null;
  fromName: string | null;
  toId: number;
  toName: string;
  transferredById: number;
  transferredByName: string;
  transferredAt: string;
}

export interface TransferStory {
  description: string | null;
  editedBy: number | null;
  editedByName: string | null;
  editedAt: string | null;
  images: TransferImage[];
}

export interface TransferImage {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  uploadedAt: string;
}

export interface TransferComment {
  id: number;
  authorId: number;
  authorName: string;
  authorRole: UserRole;
  body: string;
  createdAt: string;
  blottedAt: string | null;
  huzzahCount: number;
  huzzahedByMe: boolean;
}

export interface StagingImage {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
}

export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  role: UserRole;
}

export interface UserEntry {
  id: number;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  role: UserRole;
}

export interface AuthMeResponse {
  user: AuthUser;
  users: UserEntry[];
}

export interface DevUserEntry {
  username: string;
  displayName: string;
  role: UserRole;
}

export interface DevLoginInfo {
  enabled: boolean;
  users: DevUserEntry[];
}

export interface TransferResult {
  transferId: number;
  color: string;
  holderId: number;
  holderName: string;
  holderAvatarUrl: string | null;
  updatedAt: string;
}
