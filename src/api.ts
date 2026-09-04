import { useState, useEffect, useCallback } from "react";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export type BrickColor = "red" | "blue";

export type UserRole = "knight" | "visitor";

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

export interface StagingImage {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
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

interface AuthMeResponse {
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

interface DataState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useData<T>(url: string): DataState<T> {
  const [data, setData] = useState<T | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJson<T>(url);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useBricks() {
  return useData<BrickState[]>("/api/bricks");
}

export function useTransfers() {
  return useData<Transfer[]>("/api/transfers");
}

export function useCurrentUser() {
  return useData<AuthMeResponse>("/api/auth/me");
}

export async function fetchDevLoginConfig(): Promise<DevLoginInfo> {
  return fetchJson<DevLoginInfo>("/api/auth/dev");
}

export async function devLogin(username: string): Promise<void> {
  await fetchJson("/api/auth/dev/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
}

export async function registerVisit(): Promise<number> {
  const res = await fetchJson<{ count: number }>("/api/visits", {
    method: "POST",
  });
  return res.count;
}

export interface TransferResult {
  transferId: number;
  color: string;
  holderId: number;
  holderName: string;
  holderAvatarUrl: string | null;
  updatedAt: string;
}

export async function transferBrick(
  color: BrickColor,
  to: number,
  description: string,
  imageIds: number[],
): Promise<TransferResult> {
  return fetchJson<TransferResult>(`/api/bricks/${color}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, description, imageIds }),
  });
}

export async function seizeBlueBrick(
  description: string,
  imageIds: number[],
): Promise<TransferResult> {
  return fetchJson<TransferResult>("/api/bricks/blue/seize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, imageIds }),
  });
}

export async function fetchTransferStory(id: number): Promise<TransferStory> {
  return fetchJson<TransferStory>(`/api/transfers/${id}/story`);
}

export async function editStory(
  id: number,
  description: string,
): Promise<{ description: string; editedBy: number; editedByName: string; editedAt: string }> {
  return fetchJson(`/api/transfers/${id}/story`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
}

export async function uploadStagingImage(file: File): Promise<StagingImage> {
  const form = new FormData();
  form.append("file", file);
  return fetchJson<StagingImage>("/api/uploads/staging", {
    method: "POST",
    body: form,
  });
}

export async function deleteStagingImage(id: number): Promise<void> {
  await fetchJson(`/api/uploads/staging/${id}`, { method: "DELETE" });
}

export async function uploadTransferImage(
  transferId: number,
  file: File,
): Promise<TransferImage> {
  const form = new FormData();
  form.append("file", file);
  return fetchJson<TransferImage>(`/api/transfers/${transferId}/images`, {
    method: "POST",
    body: form,
  });
}

export async function deleteTransferImage(
  transferId: number,
  imageId: number,
): Promise<void> {
  await fetchJson(`/api/transfers/${transferId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function fetchTransferComments(
  transferId: number,
): Promise<TransferComment[]> {
  return fetchJson<TransferComment[]>(`/api/transfers/${transferId}/comments`);
}

export async function addGloss(
  transferId: number,
  body: string,
): Promise<TransferComment> {
  return fetchJson<TransferComment>(`/api/transfers/${transferId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
}

export async function huzzahComment(
  transferId: number,
  commentId: number,
): Promise<{ huzzahCount: number }> {
  return fetchJson<{ huzzahCount: number }>(
    `/api/transfers/${transferId}/comments/${commentId}/huzzah`,
    { method: "POST" },
  );
}

export async function blotComment(
  transferId: number,
  commentId: number,
): Promise<{ blottedAt: string }> {
  return fetchJson<{ blottedAt: string }>(
    `/api/transfers/${transferId}/comments/${commentId}/blot`,
    { method: "POST" },
  );
}

export async function chiselComment(
  transferId: number,
  commentId: number,
): Promise<void> {
  await fetchJson(`/api/transfers/${transferId}/comments/${commentId}`, {
    method: "DELETE",
  });
}