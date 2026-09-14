<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { docs } from '#lib';

	let { children } = $props();
</script>

<svelte:head>
	<title>Visdown</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
	<header>
		<a href="/" class="brand">Visdown</a>
		<nav>
			<a href="/examples">Examples</a>
			{#each docs as doc (doc.slug)}
				<a href="/{doc.slug}">{doc.title}</a>
			{/each}
		</nav>
	</header>

	<main>
		{@render children()}
	</main>

	<footer>
		<span>Markdown in, Svelte 5 out.</span>
		<a href="https://github.com/amitkaps/visdown">github.com/amitkaps/visdown</a>
	</footer>
</div>

<style>
	.shell {
		max-width: 42rem;
		margin: 0 auto;
		padding: 1.5rem;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--border);
	}

	.brand {
		font-weight: 700;
		text-decoration: none;
		color: var(--text);
	}

	nav {
		display: flex;
		gap: 1rem;
	}

	main {
		flex: 1;
		padding: 2rem 0;
	}

	footer {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		justify-content: space-between;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.85rem;
	}
</style>
