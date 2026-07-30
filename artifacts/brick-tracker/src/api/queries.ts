import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { BrickState, Transfer } from "./types";

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return (await res.json()) as T;
}

export const getBricksQueryKey = ["/api/bricks"] as const;
export const getTransfersQueryKey = ["/api/transfers"] as const;

export function useBricks(): UseQueryResult<BrickState[]> {
  return useQuery({
    queryKey: getBricksQueryKey,
    queryFn: ({ signal }) => fetchJson<BrickState[]>("/api/bricks", { signal }),
  });
}

export function useTransfers(): UseQueryResult<Transfer[]> {
  return useQuery({
    queryKey: getTransfersQueryKey,
    queryFn: ({ signal }) => fetchJson<Transfer[]>("/api/transfers", { signal }),
  });
}