<script lang="ts">
	import { examples } from '#lib';
</script>

<svelte:head>
	<title>Examples · Visdown</title>
	<meta name="description" content="Live, interactive documents compiled by Visdown." />
</svelte:head>

<h1>Examples</h1>
<p>Each one is a real <code>.md</code> file, compiled to Svelte and rendered live below.</p>

<div class="cards">
	{#each examples as example (example.slug)}
		<a class="card" href="/examples/{example.slug}">
			<strong>{example.title}</strong>
			<span>{example.summary}</span>
		</a>
	{/each}
</div>

<style>
	.cards {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		margin: 1.5rem 0;
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		text-decoration: none;
		color: var(--text);
	}

	.card:hover {
		background: var(--surface-hover);
	}

	.card span {
		color: var(--text-muted);
		font-size: 0.9rem;
	}
</style>
