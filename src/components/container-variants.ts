import { cva } from "class-variance-authority";

/**
 * Container — horizontally centered page column. Page margins come from the
 * spacing tokens (`gutter` on mobile, `margin-page` from md up); the maximum
 * width is one of the three `--max-width-container-*` tokens.
 *
 * **The sizes name a role, not a size step** — `page` / `content` / `reading`,
 * because the question a call site has to answer is "what is on this page",
 * not "how many pixels". The previous names were positional (`default` /
 * `narrow`), which is why a consumer that wanted the middle width reached for
 * `className="max-w-[1000px]"` instead: there was no name to ask for.
 *
 * **Why `max-w-(--token)` and not `max-w-container-content`.** Both compile:
 * Tailwind 4 *does* have a `--max-width-*` theme namespace (measured with
 * tailwindcss 4.3.2 against this file's own `tokens.css` — `max-w-container-max`
 * emits `max-width: var(--max-width-container-max)`), so the older comment here
 * claiming it does not was wrong. The reason to use the arbitrary-variable form
 * is `tailwind-merge`, which `cn()` runs on every Container: measured with
 * tailwind-merge 3.6.0, `max-w-(--max-width-container-content) max-w-3xl`
 * collapses to `max-w-3xl`, while `max-w-container-content max-w-3xl` keeps
 * **both** classes — a custom theme key is not in its `max-w` conflict group, so
 * a call site's own width would no longer win and CSS source order would decide.
 * A DS token behind `max-w-(--…)` is therefore the pattern here; a bare Tailwind
 * step (what `narrow` used to be) is the second working form, but it hides the
 * value from `tokens.css` and cannot be retuned in one place.
 */
export const containerVariants = cva("mx-auto w-full px-gutter md:px-margin-page", {
  variants: {
    size: {
      /** Page maximum — the widest a page gets (1440px). Dashboards, tables,
       *  editor shells: content that uses the whole canvas. */
      page: "max-w-(--max-width-container-max)",
      /** Page content — a centered content column (1000px). Where an ordinary
       *  page of cards, grids or sections should start; not the cva default,
       *  which stays `page` so no existing page moves. */
      content: "max-w-(--max-width-container-content)",
      /** Reading measure — one column of running text or form fields (672px).
       *  A text measure, so the token is in rem and scales with the user's
       *  font size. */
      reading: "max-w-(--max-width-container-reading)",
    },
  },
  defaultVariants: {
    size: "page",
  },
});
