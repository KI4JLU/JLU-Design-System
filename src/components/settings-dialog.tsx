import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { NavItem } from "./nav-item";
import { SidebarPanel } from "./sidebar-panel";
import { useUiShape } from "./ui-shape-context";

export interface SettingsSection {
  /** Stable id; also the controlled `value`. */
  value: string;
  label: string;
  icon?: React.ReactNode;
  /** Extra words the search matches (the rows' labels, synonyms). */
  keywords?: string[];
  content: React.ReactNode;
}

export interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: SettingsSection[];
  /** Controlled section; omit for uncontrolled (starts on the first). */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Accessible name of the dialog. Default "Einstellungen". */
  title?: string;
  closeLabel?: string;
  searchPlaceholder?: string;
  /** Shown when the search matches no section. */
  emptyLabel?: string;
}

/**
 * The settings window: a left column with search and one row per section,
 * the chosen section on the right under its title, and the close button in
 * the top-right corner like every Dialog. Content is
 * the consumer's — build it from `SettingsRow`s.
 *
 * Search filters the sections by label and `keywords`; if the open section
 * drops out, the first match is shown. Radix dialog: focus trap, Escape and
 * scroll lock included. Corner radius follows the app-wide Style.
 */
function SettingsDialog({
  open,
  onOpenChange,
  sections,
  value: valueProp,
  onValueChange,
  title = "Einstellungen",
  closeLabel = "Schließen",
  searchPlaceholder = "Einstellungen suchen",
  emptyLabel = "Keine Treffer",
}: SettingsDialogProps) {
  const { shape } = useUiShape();
  const [inner, setInner] = React.useState(sections[0]?.value);
  const [query, setQuery] = React.useState("");
  const current = valueProp ?? inner;
  const select = (v: string) => {
    setInner(v);
    onValueChange?.(v);
  };

  const q = query.trim().toLocaleLowerCase();
  const visible = q
    ? sections.filter((s) => [s.label, ...(s.keywords ?? [])].some((w) => w.toLocaleLowerCase().includes(q)))
    : sections;
  const shown = visible.find((s) => s.value === current) ?? visible[0];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          data-slot="settings-dialog"
          aria-describedby={undefined}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex h-[min(640px,88dvh)] w-[min(900px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden",
            "border border-outline-variant bg-surface-container-lowest text-on-surface shadow-modal focus:outline-none",
            shape === "pill" ? "rounded-3xl" : "rounded-xl",
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {/* The section column is the same SidebarPanel frame as every side
              column: search fixed on top, the rows below scroll. */}
          <nav
            aria-label={title}
            className="w-60 shrink-0 border-r border-outline-variant bg-surface-container-low max-sm:w-auto"
          >
            <SidebarPanel
              fade={0}
              head={(
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  leadingIcon={<Search aria-hidden="true" />}
                />
              )}
            >
              <div className="flex flex-col gap-1">
                {visible.map((s) => (
                  <NavItem
                    key={s.value}
                    type="button"
                    active={s.value === shown?.value}
                    onClick={() => select(s.value)}
                  >
                    {s.icon}
                    <span>{s.label}</span>
                  </NavItem>
                ))}
                {visible.length === 0 && (
                  <p className="px-3 py-2 text-sm text-on-surface-variant">{emptyLabel}</p>
                )}
              </div>
            </SidebarPanel>
          </nav>
          <section
            aria-labelledby={shown ? `settings-section-${shown.value}` : undefined}
            className="flex min-w-0 flex-1 flex-col overflow-y-auto px-8 py-6 max-sm:px-4"
          >
            {shown && (
              <>
                <h2
                  id={`settings-section-${shown.value}`}
                  className="m-0 border-b border-outline-variant pr-12 pb-5 text-2xl font-semibold text-on-surface"
                >
                  {shown.label}
                </h2>
                <div className="flex flex-col">{shown.content}</div>
              </>
            )}
          </section>
          {/* Top-right, like every Dialog's close. */}
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4" aria-label={closeLabel} title={closeLabel}>
              <X aria-hidden="true" className="size-5" />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export interface SettingsRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** The control on the right (Select, Switch, Button) — or a read-only value. */
  control?: React.ReactNode;
  /** Id for the label, so the control can point `aria-labelledby` at it. */
  labelId?: string;
}

/** One line of a settings section: label (+ description) left, control right, a rule below. */
const SettingsRow = React.forwardRef<HTMLDivElement, SettingsRowProps>(
  ({ label, description, control, labelId, className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="settings-row"
      className={cn("flex flex-col gap-3 border-b border-outline-variant py-5 last:border-b-0", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <div id={labelId} className="text-base text-on-surface">{label}</div>
          {description && <p className="m-0 mt-1 text-sm text-on-surface-variant">{description}</p>}
        </div>
        {control && <div className="shrink-0">{control}</div>}
      </div>
      {children}
    </div>
  ),
);
SettingsRow.displayName = "SettingsRow";

export { SettingsDialog, SettingsRow };
