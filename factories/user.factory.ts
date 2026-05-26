import { CreateUserRequest } from '@api/models/user.model';
import { faker } from '@faker-js/faker';

export class UserFactory {
  static create(overrides?: Partial<CreateUserRequest>): CreateUserRequest {
    return {
      firstName: faker.person.firstName(),

      lastName: faker.person.lastName(),

      email: faker.internet.email(),

      password: faker.internet.password({
        length: 12,
      }),

      ...overrides,
    };
  }
}
