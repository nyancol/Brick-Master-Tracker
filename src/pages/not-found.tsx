import { t } from "@/hooks/use-translation";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-4 rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">
          {t("notFound.title")}
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          {t("notFound.description")}
        </p>
      </div>
    </div>
  );
}