import { format } from "date-fns";
import { History, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBricks, useTransfers, transferBrick } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { t, getLanguage, changeLanguage } from "@/hooks/use-translation";
import { FRIENDS } from "../../shared/constants";
import { useState, useCallback, useEffect } from "react";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
] as const;

export default function Home() {
  const [, forceRender] = useState(0);
  const { toast } = useToast();
  const { data: bricks, loading: bricksLoading, refetch: refetchBricks } = useBricks();
  const { data: transfers, loading: transfersLoading, refetch: refetchTransfers } = useTransfers();
  const [pending, setPending] = useState(false);

  const handleTransfer = useCallback(
    async (color: "red" | "blue", to: string) => {
      setPending(true);
      try {
        await transferBrick(color, to);
        refetchBricks();
        refetchTransfers();
      } catch (err) {
        toast({
          title: t("transferFailed"),
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      } finally {
        setPending(false);
      }
    },
    [refetchBricks, refetchTransfers, toast],
  );

  const handleLangChange = useCallback((lang: string) => {
    changeLanguage(lang as "en" | "fr");
    forceRender((n) => n + 1);
  }, []);

  const redBrick = bricks?.find((b) => b.color === "red");
  const blueBrick = bricks?.find((b) => b.color === "blue");

  if (bricksLoading || transfersLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-mono text-muted-foreground uppercase tracking-widest text-sm">
          {t("loading")}
        </p>
      </div>
    );
  }

  const title = t("title");

  return (
    <div className="min-h-screen w-full p-4 md:p-8 max-w-5xl mx-auto space-y-12">
      <header className="text-center space-y-4 mb-12">
        <div className="flex justify-end gap-1 mb-2">
          {LANGS.map((lang) => {
            const active = getLanguage() === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLangChange(lang.code)}
                className={`font-mono text-xs px-3 py-1 rounded border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight uppercase">
          {title.split(" ").map((word, i) => (
            <span key={i}>
              {i > 0 && " "}
              {i === title.split(" ").length - 1 ? (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-cyan-500">
                  {word}
                </span>
              ) : (
                word
              )}
            </span>
          ))}
        </h1>
        <p className="font-mono text-muted-foreground tracking-widest uppercase text-sm md:text-base">
          {t("subtitle")}
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Red Brick — Honor */}
        <div className="relative group">
          <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-3xl group-hover:bg-red-500/30 transition-all duration-500" />
          <div className="relative h-full bg-card border-2 border-red-500/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 overflow-hidden transition-transform duration-500 hover:scale-[1.02] brick-shadow-red">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
            <div className="p-2">
              <img
                src="/red-brick.png"
                alt="Red Lego Brick"
                className="w-24 h-24 object-contain drop-shadow-[0_4px_16px_rgba(220,38,38,0.5)]"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold uppercase tracking-wide text-red-400">
                {t("honor.name")}
              </h2>
              <p className="text-muted-foreground font-mono text-sm">
                {t("honor.heldBy")}
              </p>
              <div className="text-4xl font-black text-white py-2">
                {redBrick?.holder || "Unknown"}
              </div>
            </div>
            <div className="w-full pt-4 mt-auto space-y-3 border-t border-red-500/20">
              <p className="text-xs font-mono uppercase text-red-500/70 tracking-widest">
                {t("honor.transferTo")}
              </p>
              <div className="flex gap-3 justify-center">
                {FRIENDS.filter((f) => f !== redBrick?.holder).map((friend) => (
                  <Button
                    key={friend}
                    variant="outline"
                    className="flex-1 border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                    onClick={() => handleTransfer("red", friend)}
                    disabled={pending}
                  >
                    {friend}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Blue Brick — Shame */}
        <div className="relative group">
          <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-3xl group-hover:bg-cyan-500/30 transition-all duration-500" />
          <div className="relative h-full bg-card border-2 border-cyan-500/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 overflow-hidden transition-transform duration-500 hover:scale-[1.02] brick-shadow-blue">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <div className="p-2">
              <img
                src="/blue-brick.png"
                alt="Blue Lego Brick"
                className="w-24 h-24 object-contain drop-shadow-[0_4px_16px_rgba(6,182,212,0.5)]"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold uppercase tracking-wide text-cyan-400">
                {t("shame.name")}
              </h2>
              <p className="text-muted-foreground font-mono text-sm">
                {t("shame.cursedUpon")}
              </p>
              <div className="text-4xl font-black text-white py-2">
                {blueBrick?.holder || "Unknown"}
              </div>
            </div>
            <div className="w-full pt-4 mt-auto space-y-3 border-t border-cyan-500/20">
              <p className="text-xs font-mono uppercase text-cyan-500/70 tracking-widest">
                {t("shame.offloadTo")}
              </p>
              <div className="flex gap-3 justify-center">
                {FRIENDS.filter((f) => f !== blueBrick?.holder).map(
                  (friend) => (
                    <Button
                      key={friend}
                      variant="outline"
                      className="flex-1 border-cyan-500/30 hover:bg-cyan-500 hover:text-white transition-colors"
                      onClick={() => handleTransfer("blue", friend)}
                      disabled={pending}
                    >
                      {friend}
                    </Button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer History */}
      <div className="mt-16 pt-8 border-t border-border">
        <div className="flex items-center gap-3 mb-8">
          <History className="w-6 h-6 text-muted-foreground" />
          <h3 className="text-xl font-bold uppercase tracking-wider">
            {t("ledger.title")}
          </h3>
        </div>
        {!transfers || transfers.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-muted">
            <p className="font-mono text-muted-foreground">
              {t("ledger.empty")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      transfer.color === "red"
                        ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                        : "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                    }`}
                  />
                  <div className="flex items-center gap-3 font-mono text-sm md:text-base">
                    <span className="text-muted-foreground">
                      {transfer.fromHolder}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                    <span className="font-bold text-foreground">
                      {transfer.toHolder}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-muted-foreground">
                    {format(
                      new Date(transfer.transferredAt),
                      "MMM d, HH:mm",
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}