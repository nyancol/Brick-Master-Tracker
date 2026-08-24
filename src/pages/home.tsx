import { Loader2, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBricks, transferBrick, type AuthUser, type UserEntry } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { t, getLanguage, changeLanguage } from "@/hooks/use-translation";
import { useState, useCallback } from "react";
import TransferModal from "@/components/TransferModal";
import ChroniclesView from "@/components/ChroniclesView";

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
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
            <User className="w-4 h-4" />
            {user.displayName}
          </div>
          <div className="flex gap-1">
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
                {redBrick?.holderName || "—"}
              </div>
            </div>
            <div className="w-full pt-4 mt-auto space-y-3 border-t border-red-500/20">
              {isRedHolder ? (
                <>
                  <p className="text-xs font-mono uppercase text-red-500/70 tracking-widest">
                    {t("honor.transferTo")}
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    {users
                      .filter((u) => u.id !== user.id)
                      .map((friend) => (
                        <Button
                          key={friend.id}
                          variant="outline"
                          className="flex-1 border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                          onClick={() =>
                            setModal({
                              color: "red",
                              recipientId: friend.id,
                              recipientName: friend.displayName,
                            })
                          }
                          disabled={pending}
                        >
                          {friend.displayName}
                        </Button>
                      ))}
                  </div>
                </>
              ) : (
                <p className="text-sm font-mono text-red-500/50 uppercase tracking-widest">
                  {t("honor.waitingForTransfer").replace("{name}", redBrick?.holderName || "someone")}
                </p>
              )}
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
                {blueBrick?.holderName || "—"}
              </div>
            </div>
            <div className="w-full pt-4 mt-auto space-y-3 border-t border-cyan-500/20">
              {isBlueHolder ? (
                <>
                  <p className="text-xs font-mono uppercase text-cyan-500/70 tracking-widest">
                    {t("shame.offloadTo")}
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    {users
                      .filter((u) => u.id !== user.id)
                      .map((friend) => (
                        <Button
                          key={friend.id}
                          variant="outline"
                          className="flex-1 border-cyan-500/30 hover:bg-cyan-500 hover:text-white transition-colors"
                          onClick={() =>
                            setModal({
                              color: "blue",
                              recipientId: friend.id,
                              recipientName: friend.displayName,
                            })
                          }
                          disabled={pending}
                        >
                          {friend.displayName}
                        </Button>
                      ))}
                  </div>
                </>
              ) : (
                <p className="text-sm font-mono text-cyan-500/50 uppercase tracking-widest">
                  {t("shame.waitingForTransfer").replace("{name}", blueBrick?.holderName || "someone")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User footer */}
      <div className="flex justify-center">
        <a
          href="/api/auth/logout"
          className="flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t("logout")}
        </a>
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