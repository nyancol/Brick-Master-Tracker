import { t } from "@/hooks/use-translation";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-4 bevel bg-card border-2 border-gold/40 p-8 text-center space-y-4">
        <img
          src="/gifs/knight-flag.gif"
          alt="A knight charging forth"
          width={165}
          height={225}
          className="mx-auto w-[110px] h-auto"
        />
        <h1 className="text-3xl font-display text-gold">
          {t("notFound.title")}
        </h1>
        <p className="font-serif text-sm text-muted-foreground italic">
          {t("notFound.description")}
        </p>
        <a href="/" className="footer-link text-sm">
          ← Home
        </a>
      </div>
    </div>
  );
}
