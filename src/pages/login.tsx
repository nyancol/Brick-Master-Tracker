import { Loader2 } from "lucide-react";
import { t } from "@/hooks/use-translation";

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-wide uppercase text-gold">
          {t("title")}
        </h1>
        <p className="font-mono text-muted-foreground tracking-widest uppercase text-sm">
          {t("subtitle")}
        </p>
      </div>

      <a
        href="/api/auth/login"
        className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-sm border border-primary font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
      >
        Sign in
      </a>
    </div>
  );
}