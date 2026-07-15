/**
 * Local ESLint plugin enforcing the design system (see docs/DESIGN_SYSTEM.md and
 * docs/COMPONENT_GUIDELINES.md). Two rules:
 *
 *   design-system/no-hardcoded-colors  (error)
 *     Flags raw Tailwind palette color utilities (bg-blue-500, text-gray-700,
 *     dark:text-green-400, …) and arbitrary hex color classes (bg-[#1e1e2e]) in
 *     any string / template literal. Colors must go through semantic tokens
 *     (bg-primary, text-on-surface, bg-success, …). `white`/`black` are allowed
 *     (common contrast overlays). Genuine exceptions get an eslint-disable line.
 *
 *   design-system/no-raw-ui-elements  (warn)
 *     Flags raw <button> / <input> JSX; prefer @ki4jlu/design-system Button / Input.
 *     Warn (not error) because some low-level controls legitimately stay raw
 *     (dropdown internals, range/color inputs, borderless inline fields).
 */

const PALETTE = [
  "slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber",
  "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue",
  "indigo", "violet", "purple", "fuchsia", "pink", "rose",
].join("|");

const PREFIX = [
  "bg", "text", "border", "ring", "ring-offset", "from", "to", "via", "divide",
  "outline", "decoration", "fill", "stroke", "caret", "accent", "shadow",
  "placeholder",
].join("|");

// A palette utility, optionally with a variant prefix (dark:, hover:, md:, …)
// and an opacity suffix (/80). Anchored to a class boundary to avoid matching
// substrings of semantic tokens.
const paletteRe = new RegExp(
  `(?:^|[\\s:'"\`])(?:${PREFIX})-(?:${PALETTE})-\\d{2,3}\\b`,
);
// Arbitrary hex color class, e.g. bg-[#1e1e2e], text-[#fff].
const hexClassRe = /-\[#[0-9a-fA-F]{3,8}\]/;

function testColor(text) {
  return typeof text === "string" && (paletteRe.test(text) || hexClassRe.test(text));
}

const noHardcodedColors = {
  meta: {
    type: "problem",
    docs: { description: "Disallow raw Tailwind palette / hex colors; use semantic tokens." },
    messages: {
      hardcoded:
        "Hardcoded color class. Use a semantic token (e.g. bg-primary, text-on-surface, bg-success) — see docs/COMPONENT_GUIDELINES.md.",
    },
    schema: [],
  },
  create(context) {
    return {
      Literal(node) {
        if (testColor(node.value)) context.report({ node, messageId: "hardcoded" });
      },
      TemplateElement(node) {
        if (testColor(node.value && node.value.cooked)) {
          context.report({ node, messageId: "hardcoded" });
        }
      },
    };
  },
};

const noRawUiElements = {
  meta: {
    type: "suggestion",
    docs: { description: "Prefer shared @ki4jlu/design-system controls over raw <button>/<input>." },
    messages: {
      button:
        "Raw <button>. Prefer <Button> from @ki4jlu/design-system (or add an eslint-disable with a reason).",
      input:
        "Raw <input>. Prefer <Input> from @ki4jlu/design-system (or add an eslint-disable with a reason).",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = node.name;
        if (name.type !== "JSXIdentifier") return;
        if (name.name === "button") context.report({ node, messageId: "button" });
        else if (name.name === "input") context.report({ node, messageId: "input" });
      },
    };
  },
};

export default {
  rules: {
    "no-hardcoded-colors": noHardcodedColors,
    "no-raw-ui-elements": noRawUiElements,
  },
};
