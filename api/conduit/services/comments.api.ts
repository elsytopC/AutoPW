import { APIResponse } from '@playwright/test';
import { BaseApi } from '@api/core/baseApi';
import {
  Comment,
  CreateCommentRequest,
  commentEnvelopeSchema,
  commentsEnvelopeSchema,
} from '@api/conduit/models/comment.model';

export class CommentsApi extends BaseApi {
  async add(slug: string, body: string): Promise<Comment> {
    const payload = await this.post<unknown>(`articles/${slug}/comments`, {
      comment: { body },
    });
    return commentEnvelopeSchema.parse(payload).comment;
  }

  async list(slug: string): Promise<Comment[]> {
    const payload = await this.get<unknown>(`articles/${slug}/comments`);
    return commentsEnvelopeSchema.parse(payload).comments;
  }

  async remove(slug: string, id: number): Promise<void> {
    return this.delete(`articles/${slug}/comments/${id}`);
  }

  async tryAdd(
    slug: string,
    data: Partial<CreateCommentRequest>,
  ): Promise<APIResponse> {
    return this.client.post(`articles/${slug}/comments`, {
      data: { comment: data },
    });
  }
}
