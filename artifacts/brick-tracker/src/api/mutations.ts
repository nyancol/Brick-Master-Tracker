import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { fetchJson } from "../api/fetch";
import type { BrickState, BrickColor, TransferInput } from "./types";

interface TransferBrickArgs {
  color: BrickColor;
  data: TransferInput;
}

export function useTransferBrick(): UseMutationResult<BrickState, Error, TransferBrickArgs> {
  return useMutation({
    mutationKey: ["transferBrick"],
    mutationFn: ({ color, data }) =>
      fetchJson<BrickState>(`/api/bricks/${color}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  });
}