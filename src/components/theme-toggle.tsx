import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme, type Theme } from "../theme/ThemeContext";

const ICONS: { value: Theme; Icon: typeof Sun }[] = [
  { value: "light", Icon: Sun },
  { value: "system", Icon: Monitor },
  { value: "dark", Icon: Moon },
];

export interface ThemeToggleProps {
  className?: string;
  /**
   * Id of the `role="group"` element. The group is the only element a consumer
   * has a reason to address from outside — `aria-controls`/`aria-describedby`
   * pointing at the switch, a skip link, or a scroll target — and without this
   * prop it is unreachable, because the component renders its own DOM. The
   * option buttons stay unaddressable on purpose: they are the component's
   * internals, and an id per button would be an API for them.
   */
  id?: string;
  /** Accessible name of the whole switch group. Default "Farbschema". */
  themeLabel?: string;
  /** Accessible name of the light option. Default "Helles Design". */
  lightLabel?: string;
  /** Accessible name of the system option. Default "Systemdesign". */
  systemLabel?: string;
  /** Accessible name of the dark option. Default "Dunkles Design". */
  darkLabel?: string;
}

/**
 * Segmented light / system / dark switch. Fully visible (discoverable) and
 * keyboard-accessible; the active option is announced via `aria-pressed`.
 * All labels are overridable props (defaults in German) so bilingual
 * consumers can localize them, and `id` lands on the group so a consumer can
 * address it from outside.
 */
export function ThemeToggle({
  className,
  id,
  themeLabel = "Farbschema",
  lightLabel = "Helles Design",
  systemLabel = "Systemdesign",
  darkLabel = "Dunkles Design",
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const labels: Record<Theme, string> = {
    light: lightLabel,
    system: systemLabel,
    dark: darkLabel,
  };
  return (
    <div
      id={id}
      role="group"
      aria-label={themeLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-outline-variant p-1",
        className,
      )}
    >
      {ICONS.map(({ value, Icon }) => {
        const active = theme === value;
        const label = labels[value];
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
