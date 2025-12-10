// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { readFile } from 'fs/promises';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'SLua Dev',
			// favicon: '/favicon.svg',
			// logo: { src: './src/assets/logo.svg' },
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Martin-Pitt/slua.dev' }],
			tableOfContents: false,
			editLink: {
				baseUrl: 'https://github.com/Martin-Pitt/slua.dev/edit/main/',
			},
			components: {
				// Sidebar: './src/components/starlight/Sidebar.astro',
			},
			customCss: [
				// './src/styles/custom.css',
			],
			sidebar: [
				{
					label: 'Fundamentals',
					autogenerate: { directory: 'fundamentals' },
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
				{
					label: 'Features',
					autogenerate: { directory: 'features' },
				},
				{
					label: 'Guides',
					autogenerate: { directory: 'guides' },
				},
				{
					label: 'Recipes',
					autogenerate: { directory: 'recipes' },
				},
			],
			expressiveCode: {
				shiki: {
					langs: [
						JSON.parse(await readFile('./config/slua_grammar.json', 'utf-8')),
						JSON.parse(await readFile('./config/lsl_grammar.json', 'utf-8')),
					],
				},
			},
		}),
	],
});
