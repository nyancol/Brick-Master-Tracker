import { Loader2, DoorOpen, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Ornament } from "@/components/ui/ornament";
import { useBricks, transferBrick, type AuthUser, type UserEntry } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { t, getLanguage, changeLanguage } from "@/hooks/use-translation";
import { useState, useCallback } from "react";
import TransferModal from "@/components/TransferModal";
import ChroniclesView from "@/components/ChroniclesView";
import ThemeToggle from "@/components/ThemeToggle";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
] as const;

interface Props {
  user: AuthUser;
  users: UserEntry[];
}

export default function Home({ user, users }: Props) {
  const [, forceRender] = useState(0);
  const { toast } = useToast();
  const { data: bricks, loading: bricksLoading, refetch: refetchBricks } = useBricks();
  const [pending, setPending] = useState(false);
  const [modal, setModal] = useState<{
    color: "red" | "blue";
    recipientId: number;
    recipientName: string;
  } | null>(null);
  const [chroniclesKey, setChroniclesKey] = useState(0);

  const handleTransferConfirm = useCallback(
    async (description: string, imageIds: number[]) => {
      if (!modal) return;
      setPending(true);
      try {
        await transferBrick(modal.color, modal.recipientId, description, imageIds);
        setModal(null);
        refetchBricks();
        setChroniclesKey((k) => k + 1);
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
    [modal, refetchBricks, toast],
  );

  const handleLangChange = useCallback((lang: string) => {
    changeLanguage(lang as "en" | "fr");
    forceRender((n) => n + 1);
  }, []);

  const redBrick = bricks?.find((b) => b.color === "red");
  const blueBrick = bricks?.find((b) => b.color === "blue");

  const isRedHolder = redBrick?.holderId === user.id;
  const isBlueHolder = blueBrick?.holderId === user.id;

  if (bricksLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-gold" />
        <p className="font-mono text-muted-foreground uppercase tracking-widest text-sm">
          {t("loading")}
        </p>
      </div>
    );
  }

  const title = t("title");

  return (
    <div className="min-h-screen w-full p-4 md:p-8 max-w-5xl mx-auto space-y-12">
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="heater-shield" clipPathUnits="objectBoundingBox">
            <path d="M0,0.08 Q0,0 0.08,0 L0.92,0 Q1,0 1,0.08 L1,0.75 Q1,0.95 0.5,1 Q0,0.95 0,0.75 Z" />
          </clipPath>
        </defs>
      </svg>

      <header className="text-center space-y-4 mb-12">
        <div className="flex justify-end items-center gap-4 mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
            <Shield className="w-4 h-4" />
            {user.displayName}
          </div>
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <DoorOpen className="w-4 h-4" />
            {t("logout")}
          </a>
          <ThemeToggle />
          <div className="flex gap-1">
            {LANGS.map((lang) => {
              const active = getLanguage() === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLangChange(lang.code)}
                  className={`font-mono text-xs px-3 py-1 rounded-sm border transition-colors ${
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
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-wide uppercase text-gold">
          {title}
        </h1>
        <p className="font-mono text-muted-foreground tracking-widest uppercase text-sm md:text-base">
          {t("subtitle")}
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Red Brick — Honor */}
        <div className="relative group">
          <div className="relative h-full bg-card border-2 border-honor/40 rounded-sm p-8 flex flex-col items-center text-center space-y-6 overflow-hidden transition-all duration-500 hover:opacity-90 hover:-rotate-1">
            <Ornament position="top-left" size="md" />
            <Ornament position="top-right" size="md" />
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ clipPath: "url(#heater-shield)" }}>
              <div className="w-full h-full bg-honor" />
            </div>
            <div className="p-2">
              <img
                src="/red-brick.png"
                alt="Red Lego Brick"
                className="w-24 h-24 object-contain drop-shadow-[0_4px_16px_rgba(220,38,38,0.3)]"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide text-honor">
                {t("honor.name")}
              </h2>
              <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
                {t("honor.heldBy")}
              </p>
              <div className="text-4xl font-serif font-black text-foreground py-2">
                {redBrick?.holderName || "—"}
              </div>
            </div>
            <div className="w-full pt-4 mt-auto space-y-3 border-t border-honor/20">
              {isRedHolder ? (
                <>
                  <p className="text-xs font-mono uppercase text-honor/70 tracking-widest">
                    {t("honor.transferTo")}
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    {users
                      .filter((u) => u.id !== user.id)
                      .map((friend) => (
                        <Button
                          key={friend.id}
                          variant="outline"
                          className="flex-1 border-honor/40 text-honor hover:bg-honor hover:text-primary-foreground transition-colors"
                          onClick={() =>
                            setModal({
                              color: "red",
                              recipientId: friend.id,
                              recipientName: friend.username,
                            })
                          }
                          disabled={pending}
                        >
                          {friend.username}
                        </Button>
                      ))}
                  </div>
                </>
              ) : (
                <p className="text-sm font-mono text-honor/50 uppercase tracking-widest">
                  {t("honor.waitingForTransfer").replace("{name}", redBrick?.holderName || "someone")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Blue Brick — Shame */}
        <div className="relative group">
          <div className="relative h-full bg-card border-2 border-shame/40 rounded-sm p-8 flex flex-col items-center text-center space-y-6 overflow-hidden transition-all duration-500 hover:opacity-90 hover:-rotate-1">
            <Ornament position="top-left" size="md" />
            <Ornament position="top-right" size="md" />
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ clipPath: "url(#heater-shield)" }}>
              <div className="w-full h-full bg-shame" />
            </div>
            <div className="p-2">
              <img
                src="/blue-brick.png"
                alt="Blue Lego Brick"
                className="w-24 h-24 object-contain drop-shadow-[0_4px_16px_rgba(6,182,212,0.3)]"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide text-shame">
                {t("shame.name")}
              </h2>
              <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
                {t("shame.cursedUpon")}
              </p>
              <div className="text-4xl font-serif font-black text-foreground py-2">
                {blueBrick?.holderName || "—"}
              </div>
            </div>
            <div className="w-full pt-4 mt-auto space-y-3 border-t border-shame/20">
              {isBlueHolder ? (
                <>
                  <p className="text-xs font-mono uppercase text-shame/70 tracking-widest">
                    {t("shame.offloadTo")}
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    {users
                      .filter((u) => u.id !== user.id)
                      .map((friend) => (
                        <Button
                          key={friend.id}
                          variant="outline"
                          className="flex-1 border-shame/40 text-shame hover:bg-shame hover:text-primary-foreground transition-colors"
                          onClick={() =>
                            setModal({
                              color: "blue",
                              recipientId: friend.id,
                              recipientName: friend.username,
                            })
                          }
                          disabled={pending}
                        >
                          {friend.username}
                        </Button>
                      ))}
                  </div>
                </>
              ) : (
                <p className="text-sm font-mono text-shame/50 uppercase tracking-widest">
                  {t("shame.waitingForTransfer").replace("{name}", blueBrick?.holderName || "someone")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider ornament */}
      <div className="relative py-4 flex items-center justify-center">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <span className="absolute px-4 text-gold/60 bg-background text-lg">❦</span>
      </div>

      {/* Transfer Modal */}
      {modal && (
        <TransferModal
          color={modal.color}
          recipientName={modal.recipientName}
          onConfirm={handleTransferConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Chronicles */}
      <ChroniclesView key={chroniclesKey} currentUser={user} />
    </div>
  );
}