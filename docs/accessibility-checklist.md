# Accessibility manual checklist

Automated tools (Lighthouse, axe) catch roughly a third of real accessibility
issues. Run this by hand against https://tungbq.github.io/dohsites/ after any
change to layout, theme, or the project grid.

## Keyboard only (unplug the mouse)

1. `Tab` from a blank address bar. First stop should be the skip-link
   ("Skip to main content"), hidden until focused.
2. `Enter` on the skip-link jumps to `#main`, past the header nav.
3. Continue `Tab`ing: nav links (About, Stack, Projects) → theme toggle →
   search input → each category filter button → each language filter
   button → each project card's title link (in visual/DOM order, top-left
   to bottom-right) → footer social links.
4. Every stop must show a visible ring (2px accent-colored outline). No
   stop should be invisible or trapped (can't `Tab` out).
5. `Enter`/`Space` on the theme toggle cycles light → dark → system;
   confirm the page actually repaints (background/text swap).

## Zoom

1. Browser zoom to 200%, then 400%.
2. No horizontal scrollbar on the page body at either level.
3. No text is clipped or overlapping; buttons/filters wrap onto new lines
   rather than overflowing.

## Screen reader (VoiceOver / NVDA / Orca — any one)

1. Type a search term that narrows the project grid (e.g. "terraform").
2. Confirm the result count region (`aria-live="polite"`, "N projects") is
   announced without needing to navigate to it manually.
3. Confirm each project card's repo link announces "opens in new tab" and
   the stars/forks numbers are read with their unit ("N stars", not just
   a bare number after a star emoji).

## Contrast (recheck when `@theme` tokens change)

Recompute pairs against **both** `--background` and `--surface` in light
and dark: `foreground`, `muted`, `accent`. All must be ≥ 4.5:1. The active
filter button and skip-link use `text-background` on `bg-accent`
specifically because plain `text-white` fails 4.5:1 against the
dark-theme accent color (2.5:1) — don't revert that to `text-white`.

## Headings

`document.querySelectorAll('h1,h2,h3,h4,h5,h6')` in the browser console,
or `grep -o '<h[1-6][^>]*>' out/index.html` on a fresh build — exactly one
`h1`, every section `h2`, no jump from `h2` straight to `h4`+.
