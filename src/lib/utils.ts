import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind class names conditionally, resolving conflicts so the last
 * utility wins (e.g. cn("p-2", condition && "p-4") -> "p-4"). This is the
 * standard shadcn/ui helper and the required way to compose classes on the
 * shared UI components introduced from Phase 2 onwards.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
