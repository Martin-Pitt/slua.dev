// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import preact from '@astrojs/preact';
import { readFile } from 'fs/promises';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import starWarp from '@inox-tools/star-warp';
import starlightContextualMenu from 'starlight-contextual-menu';



// https://astro.build/config
export default defineConfig({
    site: 'https://slua.dev',
    base: '/',
    integrations: [starlight({
        title: 'SLua Dev',
        favicon: '/favicon.svg',
        // logo: { src: './src/assets/logo.svg' },
        // logo: {
        //     light: './src/assets/logo.light.svg',
        //     dark: './src/assets/logo.dark.svg',
        // },
        social: [
            { icon: 'discord', label: 'Discord', href: 'https://discord.gg/NTu8eGKpeQ' },
            { icon: 'github', label: 'GitHub', href: 'https://github.com/Martin-Pitt/slua.dev' },
        ],
        tableOfContents: false,
        pagination: false,
        defaultLocale: 'root',
        locales: { root: { label: 'English', lang: 'en' } },
        editLink: { baseUrl: 'https://github.com/Martin-Pitt/slua.dev/edit/main/' },
        lastUpdated: true,
        components: {
            Header: './src/components/starlight/Header.astro',
            PageFrame: './src/components/starlight/PageFrame.astro',
        },
        customCss: [
            './src/css/custom.css',
        ],
        sidebar: [
            { label: 'Fundamentals', collapsed: true, autogenerate: { directory: 'fundamentals' } },
            {
                label: 'Reference',
                collapsed: true,
                items: [
                    { label: 'Categories', slug: 'reference' },
                    { label: 'Types', autogenerate: { directory: 'reference/types' } },
                    { label: 'Standard Library', autogenerate: { directory: 'reference/library' } },
                    { label: 'Events', slug: 'reference/events' },
                    { label: 'Constants', slug: 'reference/constants' },
                ],
            },
            { label: 'Features', collapsed: true, autogenerate: { directory: 'features' } },
            { label: 'Guides', collapsed: true, autogenerate: { directory: 'guides' } },
            { label: 'Recipes', collapsed: true, autogenerate: { directory: 'recipes' } },
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
        plugins: [
            starWarp(),
            starlightContextualMenu({
                actions: ['copy', 'view', 'chatgpt', 'claude']
            }),
        ],
    }), preact()],
});