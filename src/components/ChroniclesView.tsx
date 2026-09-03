import { useState, useCallback } from "react";
import { format } from "date-fns";
import { ArrowRight, ChevronDown, ChevronUp, Feather, Scroll, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransfers, fetchTransferStory, editStory, uploadTransferImage, deleteTransferImage, type Transfer, type TransferStory, type TransferImage, type AuthUser } from "@/api";
import { t } from "@/hooks/use-translation";
import { useToast } from "@/hooks/use-toast";

function toRoman(num: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  for (const [value, numeral] of map) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

interface Props {
  currentUser: AuthUser;
}

export default function ChroniclesView({ currentUser }: Props) {
  const { data: transfers, loading } = useTransfers();

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground font-mono text-sm uppercase tracking-widest">
        {t("loading")}
      </div>
    );
  }

  if (!transfers || transfers.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-8 pb-3 border-b-2 border-gold/30">
          <img
            src="/gifs/scroll-seal.gif"
            alt="A sealed scroll"
            width={70}
            height={90}
            className="-my-4"
          />
          <h3 className="heading-kitsch text-3xl font-display text-gold">
            {t("chronicles.title")}
          </h3>
        </div>
        <div className="rounded-none bg-card bevel border border-border">
          <p className="font-serif text-muted-foreground italic text-center py-12">
            {t("chronicles.empty")}
          </p>
        </div>
      </div>
    );
  }

  const grouped = new Map<number, Transfer[]>();
  for (const transfer of transfers) {
    const year = new Date(transfer.transferredAt).getFullYear();
    const group = grouped.get(year) ?? [];
    group.push(transfer);
    grouped.set(year, group);
  }
  const years = Array.from(grouped.keys()).sort((a, b) => b - a);

  return (
    <div className="pt-8">
      <div className="flex items-center gap-3 mb-8 pb-3 border-b-2 border-gold/30">
        <img
          src="/gifs/scroll-seal.gif"
          alt="A sealed scroll"
          width={70}
          height={90}
          className="-my-4"
        />
        <h3 className="heading-kitsch text-3xl font-display text-gold">
          {t("chronicles.title")}
        </h3>
      </div>

      <div className="space-y-12">
        {years.map((year) => (
          <div key={year}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-gold/50 to-gold/10" />
              <h4 className="font-mono text-sm uppercase tracking-[0.3em] text-[#efe4c8] dark:text-gold/80 drop-shadow-[1px_1px_0_rgba(0,0,0,0.7)]">
                ANNO DOMINI {toRoman(year)}
              </h4>
              <div className="h-px flex-1 bg-gradient-to-r from-gold/10 to-gold/50" />
            </div>
            <div className="space-y-4">
              {grouped.get(year)!.map((transfer) => (
                <ChronicleEntry
                  key={transfer.id}
                  transfer={transfer}
                  currentUser={currentUser}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChronicleEntry({
  transfer,
  currentUser,
}: {
  transfer: Transfer;
  currentUser: AuthUser;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [story, setStory] = useState<TransferStory | null>(null);
  const [loading, setLoading] = useState(false);

  const isSender = transfer.fromId === currentUser.id;

  const handleToggle = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (!story) {
      setLoading(true);
      try {
        const result = await fetchTransferStory(transfer.id);
        setStory(result);
      } catch {
        setStory({ description: null, editedBy: null, editedByName: null, editedAt: null, images: [] });
      } finally {
        setLoading(false);
      }
    }
  }, [expanded, story, transfer.id]);

  return (
    <div className="rounded-none bg-card bevel border border-border hover:border-gold/40 transition-colors overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-gold/60">
            {transfer.color === "red" ? "✦" : "✦"}
          </span>
          <div className="flex items-center gap-3 font-mono text-sm md:text-base">
            <span className="text-muted-foreground">{transfer.fromName}</span>
            <ArrowRight className="w-4 h-4 text-gold/40" />
            <span className="font-bold text-foreground">{transfer.toName}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">
            {format(new Date(transfer.transferredAt), "MMM d, yyyy")}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-4 animate-unfurl">
          {loading ? (
            <p className="font-mono text-sm text-muted-foreground">{t("loading")}</p>
          ) : story ? (
            <>
              {story.description ? (
                <StoryDisplay
                  story={story}
                  transferId={transfer.id}
                  isSender={isSender}
                  toast={toast}
                  onUpdate={(updated) => setStory((s) => s ? { ...s, ...updated } : s)}
                />
              ) : (
                <p className="font-serif text-sm text-muted-foreground italic">
                  No description for this transfer.
                </p>
              )}
              <PhotoGallery
                images={story.images}
                transferId={transfer.id}
                isSender={isSender}
                toast={toast}
                onAddImage={(img) =>
                  setStory((s) =>
                    s ? { ...s, images: [...s.images, img] } : s,
                  )
                }
                onDeleteImage={(imageId) =>
                  setStory((s) =>
                    s
                      ? { ...s, images: s.images.filter((i) => i.id !== imageId) }
                      : s,
                  )
                }
              />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function StoryDisplay({
  story,
  transferId,
  isSender,
  toast,
  onUpdate,
}: {
  story: TransferStory;
  transferId: number;
  isSender: boolean;
  toast: ReturnType<typeof useToast>["toast"];
  onUpdate: (updated: { description: string; editedBy: number; editedByName: string; editedAt: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(story.description ?? "");

  const handleSave = useCallback(async () => {
    if (!text.trim()) return;
    try {
      const result = await editStory(transferId, text);
      onUpdate(result);
      setEditing(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  }, [text, transferId, onUpdate, toast]);

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-24 bg-muted border border-border rounded-sm p-3 text-foreground font-serif text-sm resize-none focus:outline-none focus:border-gold/50 transition-colors"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={!text.trim()}>
            {t("edit.save")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setText(story.description ?? "");
              setEditing(false);
            }}
          >
            {t("modal.cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="dropcap font-serif italic text-sm leading-relaxed">{story.description}</p>
        {isSender && (
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Feather className="w-4 h-4" />
          </button>
        )}
      </div>
      {story.editedByName && story.editedAt && (
        <p className="text-xs font-mono text-muted-foreground">
          {t("chronicles.editedBy")} {story.editedByName} {t("chronicles.on")}{" "}
          {format(new Date(story.editedAt), "MMM d, yyyy 'at' HH:mm")}
        </p>
      )}
    </div>
  );
}

function PhotoGallery({
  images,
  transferId,
  isSender,
  toast,
  onAddImage,
  onDeleteImage,
}: {
  images: TransferImage[];
  transferId: number;
  isSender: boolean;
  toast: ReturnType<typeof useToast>["toast"];
  onAddImage: (img: TransferImage) => void;
  onDeleteImage: (id: number) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useCallback(
    (el: HTMLInputElement | null) => {
      if (!el) return;
      const handler = async (e: Event) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
          for (let i = 0; i < files.length; i++) {
            const result = await uploadTransferImage(transferId, files[i]);
            onAddImage(result);
          }
        } catch (err) {
          toast({
            title: "Error",
            description: err instanceof Error ? err.message : String(err),
            variant: "destructive",
          });
        } finally {
          setUploading(false);
          el.value = "";
        }
      };
      el.addEventListener("change", handler);
      return () => el.removeEventListener("change", handler);
    },
    [transferId, onAddImage, toast],
  );

  const handleDelete = useCallback(
    async (imageId: number) => {
      if (!confirm(t("edit.confirmDeletePhoto"))) return;
      try {
        await deleteTransferImage(transferId, imageId);
        onDeleteImage(imageId);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      }
    },
    [transferId, onDeleteImage, toast],
  );

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative w-24 h-24 rounded-sm overflow-hidden border border-gold/40 group">
              <a
                href={`/api/uploads/${img.filename}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`/api/uploads/${img.filename}`}
                  alt={img.originalName}
                  className="w-full h-full object-cover"
                />
              </a>
              {isSender && (
                <button
                  className="absolute top-1 right-1 bg-black/60 rounded-sm p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(img.id)}
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {isSender && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={(e) => {
              const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
              input.click();
            }}
          >
            <Scroll className="w-3 h-3 mr-1" />
            {uploading ? t("modal.uploading") : t("modal.uploadPhoto")}
          </Button>
        </>
      )}
    </div>
  );
}