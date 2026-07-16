import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("resolves standard conflicts in favor of the last class", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("keeps custom color tokens when a custom font-size token follows", () => {
    // Regression: without the extendTailwindMerge config these were lumped
    // into one group and text-on-primary was dropped (icons lost inversion).
    expect(cn("text-on-primary", "text-body-base")).toBe(
      "text-on-primary text-body-base",
    );
  });

  it("still resolves two color tokens against each other", () => {
    expect(cn("text-on-surface", "text-on-primary")).toBe("text-on-primary");
  });

  it("still resolves two custom font-size tokens against each other", () => {
    expect(cn("text-label-sm", "text-body-base")).toBe("text-body-base");
  });

  it("resolves the semantic action radius against explicit radii", () => {
    expect(cn("rounded-action", "rounded-none")).toBe("rounded-none");
    expect(cn("rounded-lg", "rounded-action")).toBe("rounded-action");
  });

  it("keeps elevation shadows distinct from shadow colors", () => {
    expect(cn("shadow-card", "shadow-black/20")).toBe(
      "shadow-card shadow-black/20",
    );
  });
});
