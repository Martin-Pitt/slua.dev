// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import preact from '@astrojs/preact';
import { readFile } from 'fs/promises';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';



// https://astro.build/config
export default defineConfig({
    integrations: [starlight({
        title: 'SLua Dev',
        favicon: '/favicon.svg',
        // logo: { src: './src/assets/logo.svg' },
        // logo: {
        //     light: './src/assets/logo.light.svg',
        //     dark: './src/assets/logo.dark.svg',
        // },
        social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Martin-Pitt/slua.dev' }],
        tableOfContents: false,
        pagination: false,
        defaultLocale: 'root',
        locales: { root: { label: 'English', lang: 'en' } },
        editLink: { baseUrl: 'https://github.com/Martin-Pitt/slua.dev/edit/main/' },
        components: {
            Header: './src/components/starlight/Header.astro',
            PageFrame: './src/components/starlight/PageFrame.astro',
            // Sidebar: './src/components/starlight/Sidebar.astro',
        },
        customCss: [
            './src/styles/custom.css',
        ],
        sidebar: [
            { label: 'Fundamentals', autogenerate: { directory: 'fundamentals' } },
            {
                label: 'Reference',
                items: [
                    { label: 'Categories', slug: 'reference' },
                    { label: 'Types', autogenerate: { directory: 'reference/types' } },
                    { label: 'Standard Library', autogenerate: { directory: 'reference/library' } },
                    { label: 'Events', slug: 'reference/events' },
                    { label: 'Constants', slug: 'reference/constants' },
                ],
            },
            { label: 'Features', autogenerate: { directory: 'features' } },
            { label: 'Guides', autogenerate: { directory: 'guides' } },
            { label: 'Recipes', autogenerate: { directory: 'recipes' } },
        ],
        expressiveCode: {
            themes: ['github-dark', 'github-light'],
            plugins: [pluginLineNumbers()],
            defaultProps: {
                showLineNumbers: false,
            },
            shiki: {
                bundledLangs: [],
                langs: [
                    JSON.parse(await readFile('./src/data/slua_grammar.json', 'utf-8')),
                    JSON.parse(await readFile('./src/data/lsl_grammar.json', 'utf-8')),
                ],
            },
        },
    }), preact()],
});