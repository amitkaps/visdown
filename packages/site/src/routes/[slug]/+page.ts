import { getDoc, docs } from '#lib';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => docs.map((doc) => ({ slug: doc.slug }));

export const load: PageLoad = ({ params }) => {
	const doc = getDoc(params.slug);
	if (!doc) error(404, 'Not found');

	return { doc };
};
