import { request, type APIRequestContext } from '@playwright/test';
import { test, expect } from '@fixtures/contract.fixture';
import { ArticlesApi, CommentsApi, ConduitAuthApi } from '@api/conduit';
import {
  ConduitArticleFactory,
  ConduitCommentFactory,
  ConduitUserFactory,
} from '@factories/conduit.factory';
import { behavior } from '@utils/allure';
import { qase } from 'playwright-qase-reporter';

type UserSession = {
  articles: ArticlesApi;
  comments: CommentsApi;
};

type TwoUserSessions = {
  owner: UserSession;
  other: UserSession;
};

function withTrailingSlash(baseURL: string): string {
  return `${baseURL.replace(/\/+$/, '')}/`;
}

async function registerUser(baseURL: string) {
  const context = await request.newContext({
    baseURL: withTrailingSlash(baseURL),
  });
  try {
    return await new ConduitAuthApi(context).register(
      ConduitUserFactory.create(),
    );
  } finally {
    await context.dispose();
  }
}

function openSession(baseURL: string, token: string) {
  return request.newContext({
    baseURL: withTrailingSlash(baseURL),
    extraHTTPHeaders: { Authorization: `Token ${token}` },
  });
}

function sessionFor(context: APIRequestContext): UserSession {
  return {
    articles: new ArticlesApi(context),
    comments: new CommentsApi(context),
  };
}

async function withTwoUsers(
  baseURL: string,
  run: (users: TwoUserSessions) => Promise<void>,
): Promise<void> {
  const [articleOwner, otherUser] =
    await test.step('Register the article owner and another user', () =>
      Promise.all([registerUser(baseURL), registerUser(baseURL)]));

  let ownerContext: APIRequestContext | undefined;
  let otherContext: APIRequestContext | undefined;

  try {
    ownerContext = await openSession(baseURL, articleOwner.token);
    otherContext = await openSession(baseURL, otherUser.token);

    await run({
      owner: sessionFor(ownerContext),
      other: sessionFor(otherContext),
    });
  } finally {
    await Promise.all([ownerContext?.dispose(), otherContext?.dispose()]);
  }
}

test.describe(
  'Conduit comments authorization (contract)',
  {
    tag: ['@api', '@contract'],
    annotation: behavior('Conduit', 'Authorization'),
  },
  () => {
    test(
      qase(55, 'rejects deletion of a comment by a non-author (IDOR)'),
      { tag: ['@smoke', '@security'] },
      async ({ conduitApiStub }) => {
        await withTwoUsers(conduitApiStub.baseURL, async ({ owner, other }) => {
          const createdArticle = await test.step('Create an article', () =>
            owner.articles.create(ConduitArticleFactory.create()));
          const commentInput = ConduitCommentFactory.create();
          const createdComment =
            await test.step('Add a comment as the article owner', () =>
              owner.comments.add(createdArticle.slug, commentInput.body));

          await test.step('Delete the comment as a different user', async () => {
            const rejectedDelete = await other.comments.tryRemove(
              createdArticle.slug,
              createdComment.id,
            );
            expect(rejectedDelete.status(), 'non-author gets 403').toBe(403);
          });

          await test.step('Comment is still listed', async () => {
            const commentsAfterRejection = await owner.comments.list(
              createdArticle.slug,
            );
            expect(
              commentsAfterRejection,
              'comment is unchanged',
            ).toContainEqual(
              expect.objectContaining({
                id: createdComment.id,
                body: createdComment.body,
              }),
            );
          });
        });
      },
    );
  },
);
