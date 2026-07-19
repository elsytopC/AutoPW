import { z } from 'zod';

export const authorSchema = z.object({
  username: z.string(),
  bio: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  image: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  following: z.boolean(),
});

export const articleSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  body: z.string(),
  tagList: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  favorited: z.boolean(),
  favoritesCount: z.number(),
  author: authorSchema,
});

// The list endpoint omits the heavy `body` field on each item.
export const articleSummarySchema = articleSchema.omit({ body: true });

export const articleEnvelopeSchema = z.object({ article: articleSchema });

export const articlesEnvelopeSchema = z.object({
  articles: z.array(articleSummarySchema),
  articlesCount: z.number(),
});

export const createArticleRequestSchema = z.object({
  title: z.string(),
  description: z.string(),
  body: z.string(),
  tagList: z.array(z.string()).optional(),
});

export type Author = z.infer<typeof authorSchema>;
export type Article = z.infer<typeof articleSchema>;
export type ArticleSummary = z.infer<typeof articleSummarySchema>;
export type ArticlesResponse = z.infer<typeof articlesEnvelopeSchema>;
export type CreateArticleRequest = z.infer<typeof createArticleRequestSchema>;
export type UpdateArticleRequest = Partial<CreateArticleRequest>;
