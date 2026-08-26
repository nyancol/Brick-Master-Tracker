import { useState, useEffect } from "react";
import { t } from "@/hooks/use-translation";
import { fetchDevLoginConfig, devLogin, type DevLoginInfo } from "@/api";

export default function Login() {
  const [devInfo, setDevInfo] = useState<DevLoginInfo | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetchDevLoginConfig()
      .then(setDevInfo)
      .catch(() => setDevInfo({ enabled: false, users: [] }));
  }, []);

  const handleDevLogin = async (username: string) => {
    setPending(true);
    try {
      await devLogin(username);
      window.location.reload();
    } catch {
      setPending(false);
    }
  };

  const showDevPicker = devInfo?.enabled && devInfo.users.length > 0;

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

      {showDevPicker && (
        <div className="flex flex-col items-center gap-3">
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Dev test users
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {devInfo!.users.map((user) => (
              <button
                key={user.username}
                onClick={() => handleDevLogin(user.username)}
                disabled={pending}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-sm border border-border text-sm font-bold uppercase tracking-wider hover:border-primary hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {user.displayName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
