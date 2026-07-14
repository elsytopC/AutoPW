import { APIResponse } from '@playwright/test';
import { BaseApi } from '@api/core/baseApi';
import {
  Article,
  ArticlesResponse,
  CreateArticleRequest,
  UpdateArticleRequest,
  articleEnvelopeSchema,
  articlesEnvelopeSchema,
} from '@api/conduit/models/article.model';

export type ListArticlesParams = {
  author?: string;
  tag?: string;
  favorited?: string;
  limit?: string;
  offset?: string;
};

export class ArticlesApi extends BaseApi {
  async create(data: CreateArticleRequest): Promise<Article> {
    const body = await this.post<unknown>('articles', { article: data });
    return articleEnvelopeSchema.parse(body).article;
  }

  async getBySlug(slug: string): Promise<Article> {
    const body = await this.get<unknown>(`articles/${slug}`);
    return articleEnvelopeSchema.parse(body).article;
  }

  async list(params?: ListArticlesParams): Promise<ArticlesResponse> {
    const body = await this.get<unknown>('articles', { params });
    return articlesEnvelopeSchema.parse(body);
  }

  /** Note: updating the title regenerates the slug, so the returned article may have a new slug. */
  async update(slug: string, data: UpdateArticleRequest): Promise<Article> {
    const body = await this.put<unknown>(`articles/${slug}`, { article: data });
    return articleEnvelopeSchema.parse(body).article;
  }

  async remove(slug: string): Promise<void> {
    return this.delete(`articles/${slug}`);
  }

  /**
   * Negative-path variants: return the raw response instead of throwing, so
   * tests can assert on error status codes and bodies directly.
   */
  async tryCreate(data: Partial<CreateArticleRequest>): Promise<APIResponse> {
    return this.client.post('articles', { data: { article: data } });
  }

  async tryGetBySlug(slug: string): Promise<APIResponse> {
    return this.client.get(`articles/${slug}`);
  }

  async tryUpdate(
    slug: string,
    data: UpdateArticleRequest,
  ): Promise<APIResponse> {
    return this.client.put(`articles/${slug}`, { data: { article: data } });
  }

  async tryRemove(slug: string): Promise<APIResponse> {
    return this.client.delete(`articles/${slug}`);
  }
}
