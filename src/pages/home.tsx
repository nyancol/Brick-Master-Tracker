import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useBricks,
  transferBrick,
  useTransfers,
  type AuthUser,
  type UserEntry,
} from "@/api";
import { useToast } from "@/hooks/use-toast";
import { t, getLanguage, changeLanguage } from "@/hooks/use-translation";
import { useSfx } from "@/hooks/use-sfx";
import { useState, useCallback, useMemo } from "react";
import { computeTenures, formatDays, type TenureData } from "@/lib/tenure";
import TransferModal from "@/components/TransferModal";
import ChroniclesView from "@/components/ChroniclesView";
import LiveTenure from "@/components/LiveTenure";
import ThemeToggle from "@/components/ThemeToggle";
import LuteToggle from "@/components/kitsch/LuteToggle";
import SfxToggle from "@/components/kitsch/SfxToggle";
import WindowFrame from "@/components/kitsch/WindowFrame";
import StatusBar from "@/components/kitsch/StatusBar";
import HearYeMarquee from "@/components/kitsch/HearYeMarquee";
import VisitorCounter from "@/components/kitsch/VisitorCounter";
import WebringFooter from "@/components/kitsch/WebringFooter";
import Badges88 from "@/components/kitsch/Badges88";
import ConstructionBadge from "@/components/kitsch/ConstructionBadge";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
] as const;

interface LedgerRow {
  userId: number;
  username: string;
  totalMs: number;
  closedMs: number;
  isCurrent: boolean;
}

function buildLedgerRows(tenure: TenureData, users: UserEntry[]): LedgerRow[] {
  return users
    .filter(
      (u) =>
        u.role === "knight" ||
        tenure.totalsMs.has(u.id) ||
        tenure.currentHolderId === u.id,
    )
    .map((u) => ({
      userId: u.id,
      username: u.username,
      totalMs: tenure.totalsMs.get(u.id) ?? 0,
      closedMs: tenure.closedMs.get(u.id) ?? 0,
      isCurrent: tenure.currentHolderId === u.id,
    }))
    .sort((a, b) => b.totalMs - a.totalMs);
}

function TenureLedger({
  tenure,
  users,
  accentClass,
}: {
  tenure: TenureData;
  users: UserEntry[];
  accentClass: string;
}) {
  const lang = getLanguage();
  return (
    <fieldset className="group-box w-full px-3 pb-3 pt-1.5">
      <legend className={`font-mono text-xs uppercase tracking-widest ${accentClass}`}>
        {t("tenure.ledgerTitle")}
      </legend>
      <ul className="w-full pt-1">
        {buildLedgerRows(tenure, users).map((row) => (
          <li
            key={row.userId}
            className={`flex items-center justify-between gap-2 px-2 py-1 font-mono text-xs ${
              row.isCurrent ? "font-bold text-gold" : "text-muted-foreground"
            }`}
          >
            <span className="truncate">
              {row.isCurrent ? "► " : ""}
              {row.username}
            </span>
            {row.isCurrent && tenure.currentHolderSinceMs != null ? (
              <LiveTenure
                closedMs={row.closedMs}
                sinceMs={tenure.currentHolderSinceMs}
                className="shrink-0"
              />
            ) : row.totalMs > 0 ? (
              <span className="shrink-0">{formatDays(row.totalMs, lang)}</span>
            ) : (
              <span className="shrink-0 italic">
                {formatDays(0, lang)} · {t("tenure.neverHeld")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

interface Props {
  user: AuthUser;
  users: UserEntry[];
}

export default function Home({ user, users }: Props) {
  const [, forceRender] = useState(0);
  const { toast } = useToast();
  const { play: playSfx } = useSfx();
  const { data: bricks, loading: bricksLoading, refetch: refetchBricks } = useBricks();
  const { data: transfers } = useTransfers();
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
        playSfx();
        setModal(null);
        refetchBricks();
        setChroniclesKey((k) => k + 1);
      } catch (err) {
        const raw = err instanceof Error ? err.message : String(err);
        const description =
          raw === "Only knights can transfer this brick"
            ? t("transfer.onlyKnights")
            : raw === "Recipient is not a participant — only knights can hold the brick"
              ? t("transfer.recipientNotKnight")
              : raw;
        toast({
          title: t("transferFailed"),
          description,
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

  const redTenure = useMemo(() => computeTenures(transfers, "red"), [transfers]);
  const blueTenure = useMemo(() => computeTenures(transfers, "blue"), [transfers]);

  const isRedHolder = redBrick?.holderId === user.id && user.role === "knight";
  const isBlueHolder = blueBrick?.holderId === user.id && user.role === "knight";

  if (bricksLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-gold" />
        <p className="font-mono text-card-foreground bg-card bevel px-4 py-2 uppercase tracking-widest text-sm">
          {t("loading")}
        </p>
      </div>
    );
  }

  const title = t("title");

  return (
    <div className="min-h-screen w-full p-4 md:p-8 max-w-5xl mx-auto">
      <header className="text-center space-y-4 mb-10">
        <div className="flex justify-end items-center gap-4 mb-2">
          <div className="flex items-center gap-2 text-sm text-card-foreground bg-card bevel px-3 py-0.5 font-mono leading-none">
            {user.displayName}
            <span className="text-[10px] uppercase tracking-widest text-gold">
              {t(user.role === "knight" ? "role.knight" : "role.visitor")}
            </span>
          </div>
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2 font-mono text-sm leading-none bg-card bevel px-3 py-0.5 text-card-foreground hover:bg-muted transition-colors"
          >
            {t("logout")}
          </a>
          <ThemeToggle />
          <LuteToggle />
          <SfxToggle />
          <div className="flex gap-1">
            {LANGS.map((lang) => {
              const active = getLanguage() === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLangChange(lang.code)}
                  className={`font-mono text-xs px-3 py-1 bevel transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground hover:bg-muted"
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          <img
            src="/gifs/dragon.gif"
            alt="A flapping dragon"
            width={150}
            height={150}
            className="w-[100px] md:w-[150px] h-auto"
          />
          <h1 className="heading-kitsch text-5xl md:text-7xl text-gold drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]">
            {title}
          </h1>
        </div>
        <p className="font-mono tracking-widest uppercase text-sm md:text-base text-[#f5e9cf] dark:text-foreground drop-shadow-[1px_1px_0_rgba(0,0,0,0.7)]">
          {t("subtitle")}
        </p>
      </header>

      <div className="mb-11">
        <HearYeMarquee transfers={transfers} />
      </div>

      {user.role === "visitor" && (
        <div className="mb-11 flex justify-center">
          <p className="font-mono text-xs md:text-sm uppercase tracking-widest text-card-foreground bg-card bevel px-4 py-2 text-center">
            {t("visitor.banner")}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Red Brick — Honor */}
        <div className="relative">
          <img
            src="/gifs/torch.gif"
            alt="A burning torch"
            width={65}
            height={128}
            className="absolute -left-8 top-6 hidden md:block"
          />
          <WindowFrame
            title={t("honor.name")}
            icon={{ src: "/gifs/swords.gif" }}
            titleBarClassName="bg-gradient-to-b from-[#8a3b34] to-[#571f1a]"
            titleTextClassName="text-[#f3e2c8]"
            suffix={
              <span className="font-mono text-[10px] text-[#f3e2c8]/70">
                HONOR.EXE
              </span>
            }
            refuseToastTitle={t("window.refuseHonor")}
            statusBar={
              <StatusBar
                left={t("window.brickCount")}
                right={
                  redTenure.currentHolderId != null &&
                  redTenure.currentHolderSinceMs != null ? (
                    <>
                      <LiveTenure
                        closedMs={redTenure.closedMs.get(redTenure.currentHolderId) ?? 0}
                        sinceMs={redTenure.currentHolderSinceMs}
                      />
                      {" · "}
                      {t("window.modem")}
                    </>
                  ) : (
                    `— · ${t("window.modem")}`
                  )
                }
              />
            }
            contentClassName="flex flex-col items-center text-center space-y-5 p-6"
          >
            <div className="bevel-in bg-muted p-4">
              <img
                src="/red-brick.png"
                alt="Red Lego Brick"
                className="w-24 h-24 object-contain drop-shadow-[0_4px_16px_rgba(220,38,38,0.3)]"
              />
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {t("honor.heldBy")}
            </p>
            <div className="bevel-in w-full bg-[#101010] px-4 py-2 text-2xl font-bold text-[#ffd76e]">
              {redBrick?.holderName || "—"}
            </div>
            <div className="w-full space-y-3 border-t-2 border-honor/30 pt-4">
              {isRedHolder ? (
                <fieldset className="group-box w-full px-3 pb-3 pt-1.5">
                  <legend className="font-mono text-xs uppercase tracking-widest text-honor/80">
                    {t("honor.transferTo")}
                  </legend>
                  <div className="flex gap-3 justify-center flex-wrap pt-1">
                    {users
                      .filter((u) => u.id !== user.id && u.role === "knight")
                      .map((friend) => (
                        <Button
                          key={friend.id}
                          variant="outline"
                          className="flex-1 bg-card text-honor hover:bg-honor hover:text-primary-foreground"
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
                </fieldset>
              ) : (
                <p className="text-sm font-mono text-honor/70 uppercase tracking-widest">
                  {t("honor.waitingForTransfer").replace("{name}", redBrick?.holderName || "someone")}
                </p>
              )}
            </div>
            <TenureLedger tenure={redTenure} users={users} accentClass="text-honor/80" />
          </WindowFrame>
        </div>

        {/* Blue Brick — Shame */}
        <div className="relative">
          <img
            src="/gifs/torch.gif"
            alt="A burning torch"
            width={65}
            height={128}
            className="absolute -right-8 top-6 hidden md:block"
          />
          <WindowFrame
            title={t("shame.name")}
            icon={{ src: "/gifs/skull.gif" }}
            titleBarClassName="bg-gradient-to-b from-[#2f3567] to-[#141838]"
            titleTextClassName="text-[#d6dcff]"
            suffix={
              <span className="font-mono text-[10px] text-[#d6dcff]/70">
                SHAME.EXE
              </span>
            }
            refuseToastTitle={t("window.refuseShame")}
            statusBar={
              <StatusBar
                left={t("window.brickCount")}
                right={
                  blueTenure.currentHolderId != null &&
                  blueTenure.currentHolderSinceMs != null ? (
                    <>
                      <LiveTenure
                        closedMs={blueTenure.closedMs.get(blueTenure.currentHolderId) ?? 0}
                        sinceMs={blueTenure.currentHolderSinceMs}
                      />
                      {" · "}
                      {t("window.modem")}
                    </>
                  ) : (
                    `— · ${t("window.modem")}`
                  )
                }
              />
            }
            contentClassName="flex flex-col items-center text-center space-y-5 p-6"
          >
            <div className="bevel-in bg-muted p-4">
              <img
                src="/blue-brick.png"
                alt="Blue Lego Brick"
                className="w-24 h-24 object-contain drop-shadow-[0_4px_16px_rgba(6,182,212,0.3)]"
              />
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {t("shame.cursedUpon")}
            </p>
            <div className="bevel-in w-full bg-[#101010] px-4 py-2 text-2xl font-bold text-[#8fb6ff]">
              {blueBrick?.holderName || "—"}
            </div>
            <div className="w-full space-y-3 border-t-2 border-shame/30 pt-4">
              {isBlueHolder ? (
                <fieldset className="group-box w-full px-3 pb-3 pt-1.5">
                  <legend className="font-mono text-xs uppercase tracking-widest text-shame/80">
                    {t("shame.offloadTo")}
                  </legend>
                  <div className="flex gap-3 justify-center flex-wrap pt-1">
                    {users
                      .filter((u) => u.id !== user.id && u.role === "knight")
                      .map((friend) => (
                        <Button
                          key={friend.id}
                          variant="outline"
                          className="flex-1 bg-card text-shame hover:bg-shame hover:text-primary-foreground"
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
                </fieldset>
              ) : (
                <p className="text-sm font-mono text-shame/70 uppercase tracking-widest">
                  {t("shame.waitingForTransfer").replace("{name}", blueBrick?.holderName || "someone")}
                </p>
              )}
            </div>
            <TenureLedger tenure={blueTenure} users={users} accentClass="text-shame/80" />
          </WindowFrame>
        </div>
      </div>

      {/* Rainbow divider */}
      <div className="my-12">
        <div className="rainbow-bar" />
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

      {/* Footer furniture */}
      <footer className="mt-14 mb-6">
        <div className="footer-furniture px-6 py-5">
          <div className="flex flex-col items-center gap-4 text-center">
            <VisitorCounter />
            <div className="pt-1">
              <WebringFooter />
            </div>
            <div className="pt-2">
              <Badges88 />
            </div>
            <p className="fine-print opacity-80 max-w-md">
              {t("footer.bestViewed")}
            </p>
            <div className="pt-3">
              <ConstructionBadge />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
