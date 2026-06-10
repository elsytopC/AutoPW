import { z } from 'zod';
import { authorSchema } from '@api/conduit/models/article.model';

export const commentSchema = z.object({
  id: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  body: z.string(),
  author: authorSchema,
});

export const commentEnvelopeSchema = z.object({ comment: commentSchema });

export const commentsEnvelopeSchema = z.object({
  comments: z.array(commentSchema),
});

export const createCommentRequestSchema = z.object({
  body: z.string(),
});

export type Comment = z.infer<typeof commentSchema>;
export type CreateCommentRequest = z.infer<typeof createCommentRequestSchema>;
