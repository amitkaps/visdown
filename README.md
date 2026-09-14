# Visdown

Markdown in, Svelte 5 out. Reactive cells, Observable-style, compiled statically.

The full spec lives in [`visdown.md`](visdown.md). This is the v2 rewrite, in
progress on the `next.visdown.com` branch — the previous marked/vega-lite-based
editor (still live at [visdown.com](http://visdown.com/)) lives on `master`.

## Layout

```
packages/
  core/    the compiler — parse → analyze → DAG → codegen (packages/core/src)
  site/    docs/demo site for next.visdown.com (SvelteKit + Cloudflare)
```

See `packages/site/src/content/status.md` for what's implemented so far.

## Commands

```sh
pnpm install
pnpm test    # unit tests, both packages
pnpm check   # typecheck + lint + format, both packages
pnpm build   # build both packages
```
