import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const isActiveLight = resolvedTheme === "light";
  const isActiveDark = resolvedTheme === "dark";
  const isSystem = theme === "system";

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Theme">
      <button
        onClick={() => setTheme(isActiveLight && !isSystem ? "system" : "light")}
        className={`font-mono text-xs px-3 py-1 bevel transition-colors ${
          isActiveLight
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground hover:bg-muted"
        }`}
        aria-label="Day mode (stone walls)"
        title="Day — stone walls"
        role="radio"
        aria-checked={isActiveLight}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme(isActiveDark && !isSystem ? "system" : "dark")}
        className={`font-mono text-xs px-3 py-1 bevel transition-colors ${
          isActiveDark
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground hover:bg-muted"
        }`}
        aria-label="Dungeon mode (starfield)"
        title="Dungeon — starfield"
        role="radio"
        aria-checked={isActiveDark}
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}
