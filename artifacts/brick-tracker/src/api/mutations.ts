import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { BrickState, BrickColor, TransferInput } from "./types";

interface TransferBrickArgs {
  color: BrickColor;
  data: TransferInput;
}

export function useTransferBrick(): UseMutationResult<BrickState, Error, TransferBrickArgs> {
  return useMutation({
    mutationKey: ["transferBrick"],
    mutationFn: ({ color, data }) =>
      fetch(`/api/bricks/${color}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
        }
        return (await res.json()) as BrickState;
      }),
  });
}