<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.doc.title} · Visdown</title>
	<meta name="description" content={data.doc.summary} />
</svelte:head>

<!-- title comes from frontmatter; html is rendered at build time from trusted local markdown (src/lib/docs.ts) -->
<article class="doc">
	<h1>{data.doc.title}</h1>
	{@html data.doc.html}
</article>

<style>
	.doc :global(h1) {
		margin: 0 0 0.5rem;
		font-size: 1.9rem;
		line-height: 1.2;
	}

	.doc :global(h2) {
		margin: 2.5rem 0 0.75rem;
		font-size: 1.3rem;
		padding-bottom: 0.3rem;
		border-bottom: 1px solid var(--border);
	}

	.doc :global(h3) {
		margin: 1.75rem 0 0.5rem;
		font-size: 1.05rem;
	}

	.doc :global(p),
	.doc :global(ul),
	.doc :global(ol) {
		margin: 0.75rem 0;
	}

	.doc :global(li) {
		margin: 0.35rem 0;
	}

	.doc :global(:not(pre) > code) {
		background: var(--surface-hover);
		padding: 0.1em 0.35em;
		border-radius: 0.3rem;
	}

	.doc :global(blockquote) {
		margin: 1rem 0;
		padding: 0.25rem 1rem;
		border-left: 3px solid var(--border);
		color: var(--text-muted);
	}

	.doc :global(hr) {
		margin: 2rem 0;
		border: 0;
		border-top: 1px solid var(--border);
	}

	.doc :global(table) {
		display: block;
		width: 100%;
		overflow-x: auto;
		border-collapse: collapse;
		margin: 1rem 0;
		font-size: 0.9rem;
	}

	.doc :global(th),
	.doc :global(td) {
		border: 1px solid var(--border);
		padding: 0.5rem 0.7rem;
		text-align: left;
		vertical-align: top;
	}

	.doc :global(th) {
		background: var(--surface-hover);
	}
</style>
