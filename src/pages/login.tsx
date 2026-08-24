import { useCurrentUser } from "@/api";
import { Loader2 } from "lucide-react";
import { t } from "@/hooks/use-translation";

export default function Login() {
  const { loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-mono text-muted-foreground uppercase tracking-widest text-sm">
          {t("loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight uppercase">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-cyan-500">
            The Brick
          </span>
        </h1>
        <p className="font-mono text-muted-foreground tracking-widest uppercase text-sm">
          {t("subtitle")}
        </p>
      </div>

      <a
        href="/api/auth/login"
        className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg uppercase tracking-wider hover:opacity-90 transition-opacity"
      >
        Sign in
      </a>
    </div>
  );
}