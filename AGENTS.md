# Working on this repo

pnpm workspace, two packages. `packages/core` is the compiler (spec →
implementation, plain TS/Node, no framework). `packages/site` is a SvelteKit +
Vite+ + Cloudflare docs shell for next.visdown.com, built the same way as
[base.amitkaps.com](https://github.com/amitkaps/base) — read that repo's
`src/content/lessons.md` for the SvelteKit 3 RC / Vite+ / pnpm 12 / Cloudflare
quirks it already worked through; they apply here unchanged.

## Docs

- `docs/spec.md` — the accepted v2 spec. Implementation follows it; if code
  and spec disagree, that's a bug in one of them, not a judgment call.
- `docs/plan.md` — roadmap, what's next and in what order. Update when
  priorities change.
- `docs/changelog.md` — what shipped, newest first. Add an entry for anything
  a user of the compiler or the site would notice.
- `packages/site/src/content/status.md` — what's implemented *right now*
  against the spec's task checklist (§8). This one doubles as a site page
  (base's dual-purpose docs-are-pages pattern), so it renders at `/status`.

## Before committing

- `pnpm test` and `pnpm check` (both packages) must pass.
- `packages/core` changes: extend `packages/core/test/compile.test.ts` rather
  than hand-verifying — tests compare AST-normalized Svelte output, not
  strings (spec §6), because codegen is free to vary whitespace and
  declaration order.
- `packages/site` changes: `pnpm --filter site check` runs format + lint +
  typecheck + `.svelte` diagnostics in one command; `vp` is a dev dependency,
  run through `pnpm run …`, not a global install.
- A push to `next.visdown.com` triggers CI, which deploys `packages/site` on
  success — don't push there with failing checks.

## Conventions carried over from base

- `#lib` import alias (not `$lib`), barrelled through `src/lib/index.ts`.
- `src/routes/+layout.ts` sets `prerender = true` / `csr = false`; a route
  needing client JS opts back in locally.
- Content pages are YAML-frontmatter markdown in `src/content/`, loaded via
  `import.meta.glob` + `marked`, validated by the Zod schema in
  `src/lib/docs.ts`. Adding a page is adding a file.
