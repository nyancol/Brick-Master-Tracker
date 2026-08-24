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
  fromId: number;
  fromName: string;
  toId: number;
  toName: string;
  transferredById: number;
  transferredByName: string;
  transferredAt: string;
}

export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface UserEntry {
  id: number;
  displayName: string;
  avatarUrl: string | null;
}

interface AuthMeResponse {
  user: AuthUser;
  users: UserEntry[];
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

export async function transferBrick(
  color: BrickColor,
  to: number,
): Promise<BrickState> {
  return fetchJson<BrickState>(`/api/bricks/${color}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to }),
  });
}