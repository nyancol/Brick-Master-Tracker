import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchJson } from "../api/fetch";
import type { BrickState, Transfer } from "./types";

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