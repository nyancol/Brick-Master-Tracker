import type { Transfer } from "../api";

export type BrickColor = "red" | "blue";

export interface TenureData {
  totalsMs: Map<number, number>;
  closedMs: Map<number, number>;
  currentHolderId: number | null;
  currentHolderSinceMs: number | null;
}

export function computeTenures(
  transfers: Transfer[] | undefined,
  color: BrickColor,
  now: number = Date.now(),
): TenureData {
  const totalsMs = new Map<number, number>();
  const closedMs = new Map<number, number>();
  const rows = (transfers ?? [])
    .filter((tr) => tr.color === color)
    .map((tr) => ({
      id: tr.id,
      fromId: tr.fromId,
      toId: tr.toId,
      at: new Date(tr.transferredAt).getTime(),
    }))
    .filter((r) => !Number.isNaN(r.at) && r.toId != null)
    .sort(
      (a, b) =>
        a.at - b.at ||
        (a.fromId === null ? -1 : 0) - (b.fromId === null ? -1 : 0) ||
        a.id - b.id,
    );

  for (let i = 0; i < rows.length; i++) {
    const start = rows[i].at;
    const end = i + 1 < rows.length ? rows[i + 1].at : now;
    const dur = Math.max(0, end - start);
    totalsMs.set(rows[i].toId, (totalsMs.get(rows[i].toId) ?? 0) + dur);
    if (i + 1 < rows.length) {
      closedMs.set(rows[i].toId, (closedMs.get(rows[i].toId) ?? 0) + dur);
    }
  }

  const last = rows[rows.length - 1];
  return {
    totalsMs,
    closedMs,
    currentHolderId: last ? last.toId : null,
    currentHolderSinceMs: last ? last.at : null,
  };
}

export function formatTenure(ms: number, lang: "en" | "fr"): string {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(safe / 86_400);
  const hh = String(Math.floor((safe % 86_400) / 3600)).padStart(2, "0");
  const mm = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  const suffix = lang === "fr" ? "j" : "d";
  return `${days}${suffix} ${hh}:${mm}:${ss}`;
}

export function formatDays(ms: number, lang: "en" | "fr"): string {
  const suffix = lang === "fr" ? "j" : "d";
  return `${Math.max(0, Math.floor(ms / 86_400_000))}${suffix}`;
}
