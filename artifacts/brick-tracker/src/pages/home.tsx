import { useGetBricks, useGetTransfers, useTransferBrick, getGetBricksQueryKey, getGetTransfersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { History, Shield, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const FRIENDS = ["Yann", "Anselme", "Thomas"];

export default function Home() {
  const queryClient = useQueryClient();
  const { data: bricks, isLoading: bricksLoading } = useGetBricks();
  const { data: transfers, isLoading: transfersLoading } = useGetTransfers();
  const transferBrick = useTransferBrick();

  const handleTransfer = (color: "red" | "blue", to: string) => {
    transferBrick.mutate(
      { color, data: { to } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBricksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTransfersQueryKey() });
        },
      }
    );
  };

  const redBrick = bricks?.find((b) => b.color === "red");
  const blueBrick = bricks?.find((b) => b.color === "blue");

  if (bricksLoading || transfersLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-mono text-muted-foreground uppercase tracking-widest text-sm">Loading System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-4 md:p-8 max-w-5xl mx-auto space-y-12">
      <header className="text-center space-y-4 mb-12">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight uppercase">
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-cyan-500">Brick</span>
        </h1>
        <p className="font-mono text-muted-foreground tracking-widest uppercase text-sm md:text-base">
          Legendary tokens of Honor and Shame
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Red Brick */}
        <div className="relative group perspective-1000">
          <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-3xl group-hover:bg-red-500/30 transition-all duration-500" />
          <div className="relative h-full bg-card border-2 border-red-500/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 overflow-hidden transition-transform duration-500 hover:scale-[1.02] brick-shadow-red">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
            
            <div className="p-4 bg-red-500/10 rounded-full">
              <Shield className="w-12 h-12 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold uppercase tracking-wide text-red-400">Brick of Honor</h2>
              <p className="text-muted-foreground font-mono text-sm">Currently held by</p>
              <div className="text-4xl font-black text-white py-2">
                {redBrick?.holder || "Unknown"}
              </div>
            </div>

            <div className="w-full pt-4 mt-auto space-y-3 border-t border-red-500/20">
              <p className="text-xs font-mono uppercase text-red-500/70 tracking-widest">Transfer to</p>
              <div className="flex gap-3 justify-center">
                {FRIENDS.filter((f) => f !== redBrick?.holder).map((friend) => (
                  <Button
                    key={friend}
                    variant="outline"
                    className="flex-1 border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                    onClick={() => handleTransfer("red", friend)}
                    disabled={transferBrick.isPending}
                    data-testid={`btn-transfer-red-${friend}`}
                  >
                    {friend}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Blue Brick */}
        <div className="relative group perspective-1000">
          <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-3xl group-hover:bg-cyan-500/30 transition-all duration-500" />
          <div className="relative h-full bg-card border-2 border-cyan-500/30 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 overflow-hidden transition-transform duration-500 hover:scale-[1.02] brick-shadow-blue">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            
            <div className="p-4 bg-cyan-500/10 rounded-full">
              <AlertTriangle className="w-12 h-12 text-cyan-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold uppercase tracking-wide text-cyan-400">Brick of Shame</h2>
              <p className="text-muted-foreground font-mono text-sm">Currently cursed upon</p>
              <div className="text-4xl font-black text-white py-2">
                {blueBrick?.holder || "Unknown"}
              </div>
            </div>

            <div className="w-full pt-4 mt-auto space-y-3 border-t border-cyan-500/20">
              <p className="text-xs font-mono uppercase text-cyan-500/70 tracking-widest">Offload to</p>
              <div className="flex gap-3 justify-center">
                {FRIENDS.filter((f) => f !== blueBrick?.holder).map((friend) => (
                  <Button
                    key={friend}
                    variant="outline"
                    className="flex-1 border-cyan-500/30 hover:bg-cyan-500 hover:text-white transition-colors"
                    onClick={() => handleTransfer("blue", friend)}
                    disabled={transferBrick.isPending}
                    data-testid={`btn-transfer-blue-${friend}`}
                  >
                    {friend}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="mt-16 pt-8 border-t border-border">
        <div className="flex items-center gap-3 mb-8">
          <History className="w-6 h-6 text-muted-foreground" />
          <h3 className="text-xl font-bold uppercase tracking-wider">Transfer Ledger</h3>
        </div>

        {transfers?.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-muted">
            <p className="font-mono text-muted-foreground">No transfers recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers?.map((transfer) => (
              <div
                key={transfer.id}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
                data-testid={`transfer-row-${transfer.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${transfer.color === 'red' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]'}`} />
                  <div className="flex items-center gap-3 font-mono text-sm md:text-base">
                    <span className="text-muted-foreground">{transfer.fromHolder}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                    <span className="font-bold text-foreground">{transfer.toHolder}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-muted-foreground">
                    {format(new Date(transfer.transferredAt), "MMM d, HH:mm")}
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
