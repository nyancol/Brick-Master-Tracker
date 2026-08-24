import { useState, useRef, useCallback } from "react";
import { X, Scroll, Check, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Ornament } from "@/components/ui/ornament";
import { t } from "@/hooks/use-translation";
import { uploadStagingImage, deleteStagingImage, type StagingImage, type BrickColor } from "@/api";

type ImageState =
  | { status: "pending"; file: File; preview: string }
  | { status: "uploading"; file: File; preview: string }
  | { status: "done"; preview: string; id: number; image: StagingImage }
  | { status: "error"; error: string };

interface Props {
  color: BrickColor;
  recipientName: string;
  onConfirm: (description: string, imageIds: number[]) => void;
  onCancel: () => void;
}

export default function TransferModal({ color, recipientName, onConfirm, onCancel }: Props) {
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImageState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasUploading = images.some((img) => img.status === "uploading" || img.status === "pending");
  const hasErrors = images.some((img) => img.status === "error");

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const pendingImgs: ImageState[] = Array.from(files).map((file) => ({
        status: "pending",
        file,
        preview: URL.createObjectURL(file),
      }));

      setImages((prev) => [...prev, ...pendingImgs]);

      for (const pending of pendingImgs) {
        const { preview, file } = pending as Extract<ImageState, { status: "pending" }>;
        setImages((prev) =>
          prev.map((i) =>
            "preview" in i && (i as { preview: string }).preview === preview
              ? ({ status: "uploading" as const, file, preview })
              : i,
          ),
        );
        try {
          const result = await uploadStagingImage(file);
          setImages((prev) =>
            prev.map((i) =>
              "preview" in i && (i as { preview: string }).preview === preview
                ? ({ status: "done" as const, preview, id: result.id, image: result })
                : i,
            ),
          );
        } catch (err) {
          URL.revokeObjectURL(preview);
          setImages((prev) =>
            prev.map((i) =>
              "preview" in i && (i as { preview: string }).preview === preview
                ? ({ status: "error" as const, error: err instanceof Error ? err.message : "Upload failed" })
                : i,
            ),
          );
        }
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [],
  );

  const handleRemoveImage = useCallback(
    async (img: ImageState) => {
      if (img.status !== "error") URL.revokeObjectURL(img.preview);
      setImages((prev) => prev.filter((i) => i !== img));
      if (img.status === "done") {
        try {
          await deleteStagingImage(img.id);
        } catch {
          // cleanup best-effort
        }
      }
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const imageIds = images
        .filter((img): img is ImageState & { status: "done" } => img.status === "done")
        .map((img) => img.id);
      onConfirm(description, imageIds);
    } finally {
      setSubmitting(false);
    }
  }, [description, images, onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-card border border-gold/40 rounded-sm p-6 space-y-6 shadow-2xl animate-seal-stamp">
        <Ornament position="top-left" size="sm" />
        <Ornament position="top-right" size="sm" />
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold uppercase tracking-wide text-gold">
            {t("honor.transferTo")} {recipientName}
          </h2>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-mono uppercase text-muted-foreground tracking-wider">
            {t("modal.descriptionLabel")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-32 bg-muted border border-border rounded-sm p-4 text-foreground font-serif text-sm resize-none focus:outline-none focus:border-gold/50 transition-colors"
            placeholder={t("modal.descriptionLabel")}
          />
          {!description.trim() && (
            <p className="text-xs font-mono text-muted-foreground">
              {t("modal.descriptionRequired")}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Scroll className="w-4 h-4 mr-2" />
            {t("modal.uploadPhoto")}
          </Button>

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-sm overflow-hidden border border-gold/30 group">
                  {img.status === "done" && (
                    <>
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Check className="w-5 h-5 text-gold" />
                      </div>
                      <button
                        className="absolute top-1 right-1 bg-black/60 rounded-sm p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(img)}
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </>
                  )}
                  {img.status === "uploading" && (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {img.status === "error" && (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <ShieldAlert className="w-5 h-5 text-destructive" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {t("modal.cancel")}
          </Button>
          <Button
            className="flex-1"
            disabled={!description.trim() || hasUploading || hasErrors || submitting}
            onClick={handleSubmit}
          >
            {t("modal.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}