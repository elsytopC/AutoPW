import http from 'http';
import { randomBytes } from 'crypto';
import {
  CreateArticleRequest,
  UpdateArticleRequest,
  LoginRequest,
  RegisterUserRequest,
} from '@api/conduit';
import { BaseStubServer } from './base.stub-server';

type StoredUser = RegisterUserRequest & {
  token: string;
  bio: string | null;
  image: string | null;
};

type StoredArticle = {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  authorUsername: string;
};

/**
 * In-process RealWorld (Conduit) API subset for contract/security tests.
 * Enforces author-only article update and delete — non-owners receive 403.
 */
export class ConduitApiStubServer extends BaseStubServer {
  protected readonly label = 'Conduit API';
  private usersByUsername = new Map<string, StoredUser>();
  private usersByToken = new Map<string, StoredUser>();
  private articlesBySlug = new Map<string, StoredArticle>();

  protected reset(): void {
    this.usersByUsername.clear();
    this.usersByToken.clear();
    this.articlesBySlug.clear();
  }

  protected errorBody(message: string): unknown {
    return { errors: { body: [message] } };
  }

  protected handle(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const pathname = url.pathname;
    const method = req.method ?? 'GET';

    if (method === 'POST' && pathname === '/users') {
      this.readBody(req, res, (body) => {
        const payload = (body as { user?: Partial<RegisterUserRequest> }).user;
        if (!payload?.username || !payload.email || !payload.password) {
          this.send(res, 422, {
            errors: { body: ['username, email, and password are required'] },
          });
          return;
        }
        if (this.usersByUsername.has(payload.username)) {
          this.send(res, 422, {
            errors: { username: ['has already been taken'] },
          });
          return;
        }
        const user = this.registerUser(payload as RegisterUserRequest);
        this.send(res, 201, { user: this.toPublicUser(user) });
      });
      return;
    }

    if (method === 'POST' && pathname === '/users/login') {
      this.readBody(req, res, (body) => {
        const payload = (body as { user?: Partial<LoginRequest> }).user;
        const user = Array.from(this.usersByUsername.values()).find(
          (candidate) =>
            candidate.email === payload?.email &&
            candidate.password === payload?.password,
        );
        if (!user) {
          this.send(res, 403, {
            errors: { 'email or password': ['is invalid'] },
          });
          return;
        }
        this.send(res, 200, { user: this.toPublicUser(user) });
      });
      return;
    }

    const articleMatch = pathname.match(/^\/articles\/([^/]+)$/);
    const authUser = this.authenticate(req);

    if (method === 'GET' && pathname === '/articles') {
      const author = url.searchParams.get('author');
      let articles = Array.from(this.articlesBySlug.values());
      if (author) {
        articles = articles.filter((a) => a.authorUsername === author);
      }
      this.send(res, 200, {
        articles: articles.map((a) => this.toArticleSummary(a)),
        articlesCount: articles.length,
      });
      return;
    }

    if (method === 'GET' && articleMatch) {
      const article = this.articlesBySlug.get(articleMatch[1]);
      if (!article) {
        this.send(res, 404, { errors: { body: ['Not Found'] } });
        return;
      }
      this.send(res, 200, { article: this.toArticle(article) });
      return;
    }

    if (method === 'POST' && pathname === '/articles') {
      if (!authUser) {
        this.send(res, 401, { errors: { body: ['Unauthorized'] } });
        return;
      }
      this.readBody(req, res, (body) => {
        const payload = (body as { article?: Partial<CreateArticleRequest> })
          .article;
        const errors = this.validateArticlePayload(payload);
        if (Object.keys(errors).length > 0) {
          this.send(res, 422, { errors });
          return;
        }
        const article = this.createArticle(
          payload as CreateArticleRequest,
          authUser.username,
        );
        this.send(res, 201, { article: this.toArticle(article) });
      });
      return;
    }

    if (method === 'PUT' && articleMatch) {
      if (!authUser) {
        this.send(res, 401, { errors: { body: ['Unauthorized'] } });
        return;
      }
      const slug = articleMatch[1];
      const existing = this.articlesBySlug.get(slug);
      if (!existing) {
        this.send(res, 404, { errors: { body: ['Not Found'] } });
        return;
      }
      if (existing.authorUsername !== authUser.username) {
        this.sendForbidden(res);
        return;
      }
      this.readBody(req, res, (body) => {
        const payload = (body as { article?: UpdateArticleRequest }).article;
        const updated = this.updateArticle(existing, payload ?? {});
        this.send(res, 200, { article: this.toArticle(updated) });
      });
      return;
    }

    if (method === 'DELETE' && articleMatch) {
      if (!authUser) {
        this.send(res, 401, { errors: { body: ['Unauthorized'] } });
        return;
      }
      const slug = articleMatch[1];
      const existing = this.articlesBySlug.get(slug);
      if (!existing) {
        this.send(res, 404, { errors: { body: ['Not Found'] } });
        return;
      }
      if (existing.authorUsername !== authUser.username) {
        this.sendForbidden(res);
        return;
      }
      this.articlesBySlug.delete(slug);
      this.sendNoContent(res);
      return;
    }

    this.send(res, 404, { errors: { body: ['Not Found'] } });
  }

  private registerUser(data: RegisterUserRequest): StoredUser {
    const user: StoredUser = {
      ...data,
      token: randomBytes(16).toString('hex'),
      bio: null,
      image: null,
    };
    this.usersByUsername.set(user.username, user);
    this.usersByToken.set(user.token, user);
    return user;
  }

  private authenticate(req: http.IncomingMessage): StoredUser | undefined {
    const header = req.headers.authorization;
    if (!header?.startsWith('Token ')) {
      return undefined;
    }
    return this.usersByToken.get(header.slice('Token '.length));
  }

  private validateArticlePayload(
    payload: Partial<CreateArticleRequest> | undefined,
  ): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    if (!payload?.title) {
      errors.title = ["can't be blank"];
    }
    if (!payload?.description) {
      errors.description = ["can't be blank"];
    }
    if (!payload?.body) {
      errors.body = ["can't be blank"];
    }
    return errors;
  }

  private createArticle(
    data: CreateArticleRequest,
    authorUsername: string,
  ): StoredArticle {
    const now = new Date().toISOString();
    const slug = this.uniqueSlug(data.title);
    const article: StoredArticle = {
      slug,
      title: data.title,
      description: data.description,
      body: data.body,
      tagList: data.tagList ?? [],
      createdAt: now,
      updatedAt: now,
      authorUsername,
    };
    this.articlesBySlug.set(slug, article);
    return article;
  }

  private updateArticle(
    existing: StoredArticle,
    data: UpdateArticleRequest,
  ): StoredArticle {
    const title = data.title ?? existing.title;
    const description = data.description ?? existing.description;
    const body = data.body ?? existing.body;
    const tagList = data.tagList ?? existing.tagList;
    const titleChanged = title !== existing.title;

    if (titleChanged) {
      this.articlesBySlug.delete(existing.slug);
    }

    const slug = titleChanged ? this.uniqueSlug(title) : existing.slug;
    const updated: StoredArticle = {
      slug,
      title,
      description,
      body,
      tagList,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
      authorUsername: existing.authorUsername,
    };
    this.articlesBySlug.set(slug, updated);
    return updated;
  }

  private uniqueSlug(title: string): string {
    const base = slugify(title) || 'article';
    let slug = base;
    let counter = 1;
    while (this.articlesBySlug.has(slug)) {
      slug = `${base}-${counter++}`;
    }
    return slug;
  }

  private toPublicUser(user: StoredUser) {
    return {
      email: user.email,
      username: user.username,
      token: user.token,
      bio: user.bio,
      image: user.image,
    };
  }

  private toAuthor(username: string) {
    const user = this.usersByUsername.get(username);
    return {
      username,
      bio: user?.bio ?? null,
      image: user?.image ?? null,
      following: false,
    };
  }

  private toArticle(article: StoredArticle) {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tagList,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: false,
      favoritesCount: 0,
      author: this.toAuthor(article.authorUsername),
    };
  }

  private toArticleSummary(article: StoredArticle) {
    return {
      slug: article.slug,
      title: article.title,
      description: article.description,
      tagList: article.tagList,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: false,
      favoritesCount: 0,
      author: this.toAuthor(article.authorUsername),
    };
  }

  private sendForbidden(res: http.ServerResponse): void {
    this.send(res, 403, {
      errors: { body: ['You do not have permission to perform this action'] },
    });
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
