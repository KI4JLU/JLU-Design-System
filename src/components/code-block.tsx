import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";

/**
 * Code/terminal viewer with a built-in copy button. Deliberately fixed-dark:
 * the `code-surface` tokens do NOT switch in dark mode (see tokens.css), so
 * the block looks identical in both themes — like an editor window.
 * Formalizes the former CampusAgents call-site exception (embed snippets).
 * The copy button writes `code` to the clipboard and confirms by swapping
 * label + icon (Copy → Check) for ~2 s.
 */
export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The raw code to display and copy. */
  code: string;
  /** Copy-button label in idle state. */
  copyLabel?: string;
  /** Copy-button label shown briefly after a successful copy. */
  copiedLabel?: string;
}

const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  (
    {
      code,
      copyLabel = "Code kopieren",
      copiedLabel = "Kopiert",
      className,
      ...props
    },
    ref,
  ) => {
    const [copied, setCopied] = React.useState(false);
    const timeoutRef = React.useRef<number | undefined>(undefined);

    // Clear a pending label reset when unmounting mid-confirmation.
    React.useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-code-surface p-4 pr-24 font-label-sm text-xs text-on-code-surface">
          {code}
        </pre>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="absolute right-2.5 top-2.5 bg-on-code-surface/10 text-on-code-surface hover:bg-on-code-surface/20"
        >
          {copied ? (
            <Check width="1em" height="1em" aria-hidden />
          ) : (
            <Copy width="1em" height="1em" aria-hidden />
          )}
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
    );
  },
);
CodeBlock.displayName = "CodeBlock";

export { CodeBlock };
