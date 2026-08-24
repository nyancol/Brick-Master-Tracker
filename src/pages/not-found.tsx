import { t } from "@/hooks/use-translation";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-4 rounded-sm border border-gold/30 bg-card p-8 text-center space-y-4 outline outline-1 outline-border -outline-offset-1">
        <h1 className="text-2xl font-display font-bold text-gold uppercase tracking-wider">
          {t("notFound.title")}
        </h1>
        <p className="font-serif text-sm text-muted-foreground italic">
          {t("notFound.description")}
        </p>
      </div>
    </div>
  );
}