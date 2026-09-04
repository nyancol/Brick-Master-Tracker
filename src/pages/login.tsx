import { useState, useEffect } from "react";
import { t } from "@/hooks/use-translation";
import { fetchDevLoginConfig, devLogin, type DevLoginInfo } from "@/api";
import { LanguageToggle } from "@/components/language-toggle";

export default function Login() {
  const [, forceRender] = useState(0);
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
    <div className="relative min-h-screen flex flex-col items-center justify-center space-y-8 p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle onLangChange={() => forceRender((n) => n + 1)} />
      </div>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <img
            src="/gifs/dragon.gif"
            alt="A flapping dragon"
            width={150}
            height={150}
            className="w-[90px] md:w-[150px] h-auto"
          />
          <h1 className="heading-kitsch text-5xl md:text-7xl text-gold">
            {t("title")}
          </h1>
        </div>
        <p className="font-mono tracking-widest uppercase text-sm text-[#f5e9cf] dark:text-foreground drop-shadow-[1px_1px_0_rgba(0,0,0,0.7)]">
          {t("subtitle")}
        </p>
      </div>

      <img
        src="/gifs/gate.gif"
        alt="The castle gate stands open"
        width={220}
        height={162}
      />

      <a
        href="/api/auth/login"
        className="bevel bg-primary text-primary-foreground px-8 py-4 font-bold uppercase tracking-wider hover:bg-muted hover:text-foreground transition-colors"
      >
        {t("login.signIn")}
      </a>

      {showDevPicker && (
        <div className="flex flex-col items-center gap-3">
          <div className="font-mono text-xs text-card-foreground uppercase tracking-widest">
            Dev test users
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {devInfo!.users.map((user) => (
              <button
                key={user.username}
                onClick={() => handleDevLogin(user.username)}
                disabled={pending}
                className="bevel bg-card text-card-foreground px-6 py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {user.displayName}
                <span className="ml-2 text-[10px] font-mono tracking-widest text-gold">
                  {t(user.role === "knight" ? "role.knight" : "role.visitor")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
