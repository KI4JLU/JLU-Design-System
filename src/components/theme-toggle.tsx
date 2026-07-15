import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme, type Theme } from "../theme/ThemeContext";

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Helles Design", Icon: Sun },
  { value: "system", label: "Systemdesign", Icon: Monitor },
  { value: "dark", label: "Dunkles Design", Icon: Moon },
];

/**
 * Segmented light / system / dark switch. Fully visible (discoverable) and
 * keyboard-accessible; the active option is announced via `aria-pressed`.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="group"
      aria-label="Farbschema"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-outline-variant p-1",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={cn(
              "rounded-full p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              active
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
