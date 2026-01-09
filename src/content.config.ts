import { defineCollection } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { z } from 'astro:schema';

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema({
		extend: z.object({
			hero: z.object({
				image: z.object({
					caption: z.string().optional().describe('The caption HTML for the image.'),
				}).optional(),
			}).optional(),
		})
	}) }),
	i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
