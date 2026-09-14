<script lang="ts">
	import { docs } from '#lib';
</script>

<h1>Visdown</h1>
<p>Markdown in, Svelte 5 out. Reactive cells, Observable-style, compiled statically.</p>

<div class="cards">
	{#each docs as doc (doc.slug)}
		<a class="card" href="/{doc.slug}">
			<strong>{doc.title}</strong>
			<span>{doc.summary}</span>
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
