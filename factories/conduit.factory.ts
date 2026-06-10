import { faker } from '@faker-js/faker';
import { RegisterUserRequest } from '@api/conduit/models/user.model';
import { CreateArticleRequest } from '@api/conduit/models/article.model';
import { CreateCommentRequest } from '@api/conduit/models/comment.model';

export class ConduitUserFactory {
  static create(overrides?: Partial<RegisterUserRequest>): RegisterUserRequest {
    // RealWorld requires unique username + email, so seed with a random id.
    const id = faker.string.alphanumeric({ length: 10, casing: 'lower' });
    return {
      username: `qa_${id}`,
      email: `qa_${id}@test.dev`,
      password: faker.internet.password({ length: 12 }),
      ...overrides,
    };
  }
}

export class ConduitArticleFactory {
  static create(
    overrides?: Partial<CreateArticleRequest>,
  ): CreateArticleRequest {
    // Slugs are derived from the title and must be globally unique on the
    // shared backend, so seed every title with a random token.
    const uniqueToken = faker.string.alphanumeric({
      length: 10,
      casing: 'lower',
    });
    return {
      title: `${faker.lorem.sentence(4)} ${uniqueToken}`,
      description: faker.lorem.sentence(),
      body: faker.lorem.paragraphs(2),
      tagList: faker.helpers.arrayElements(
        ['qa', 'playwright', 'testing', 'automation', 'typescript'],
        2,
      ),
      ...overrides,
    };
  }
}

export class ConduitCommentFactory {
  static create(
    overrides?: Partial<CreateCommentRequest>,
  ): CreateCommentRequest {
    return {
      body: faker.lorem.sentence(),
      ...overrides,
    };
  }
}
