import { faker } from '@faker-js/faker';

export class TodoFactory {
  static createTitle(wordCount = 2): string {
    return faker.lorem.words(wordCount);
  }
}
