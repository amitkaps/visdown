<script lang="ts">
	let { data } = $props();
	let Component = $derived(data.Component);

	let sourceOpen = $state(false);
</script>

<svelte:head>
	<title>{data.example.title} · Visdown</title>
	<meta name="description" content={data.example.summary} />
</svelte:head>

<a class="back" href="/examples">&larr; Examples</a>
<h1>{data.example.title}</h1>
<p class="summary">{data.example.summary}</p>

<div class="demo">
	<Component />
</div>

<button class="toggle" type="button" onclick={() => (sourceOpen = !sourceOpen)}>
	{sourceOpen ? 'Hide source' : 'View source'}
</button>

{#if sourceOpen}
	<pre class="source"><code>{data.example.source}</code></pre>
{/if}

<style>
	.back {
		display: inline-block;
		margin-bottom: 1rem;
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.9rem;
	}

	.summary {
		color: var(--text-muted);
	}

	.demo {
		margin: 1.5rem 0;
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.toggle {
		font: inherit;
		background: none;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.4rem 0.8rem;
		cursor: pointer;
		color: var(--text);
	}

	.toggle:hover {
		background: var(--surface-hover);
	}

	.source {
		margin-top: 1rem;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow-x: auto;
		font-size: 0.85rem;
		white-space: pre-wrap;
	}
</style>
