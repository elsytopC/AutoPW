import { Locator, Page } from '@playwright/test';
import { ConduitBasePage } from './base-conduit.page';

const BODY_SNIPPET_LENGTH = 40;

export class ConduitArticlePage extends ConduitBasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(slug: string): Promise<void> {
    await this.navigate(`/article/${slug}`);
  }

  get title(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** Article body is long markdown — match a prefix, not the full text. */
  bodySnippet(text: string): Locator {
    return this.page.getByText(text.slice(0, BODY_SNIPPET_LENGTH));
  }

  tag(name: string): Locator {
    return this.page.getByText(name, { exact: true });
  }
}
