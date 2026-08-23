import { useState, useEffect, useCallback } from "react";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────

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

// ── Data-fetching hook (replaces react-query for our 2 endpoints) ──────────

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

// ── Mutation (replaces react-query useMutation) ────────────────────────────

export async function transferBrick(
  color: BrickColor,
  to: string,
): Promise<BrickState> {
  return fetchJson<BrickState>(`/api/bricks/${color}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to }),
  });
}