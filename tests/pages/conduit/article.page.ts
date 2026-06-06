import { Locator, Page, expect } from '@playwright/test';
import { ConduitBasePage } from './base-conduit.page';

/** `/article/{slug}` — read a single article, comment, edit/delete (if author). */
export class ConduitArticlePage extends ConduitBasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(slug: string): Promise<void> {
    await this.navigate(`/article/${slug}`);
  }

  /** Main H1 on the article detail screen. */
  get title(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  async expectTitle(text: string): Promise<void> {
    await expect(this.title).toHaveText(text);
  }

  async expectBody(text: string): Promise<void> {
    // Body can be long markdown; match a distinctive substring, not the whole text.
    const snippet = text.slice(0, 40);
    await expect(this.page.getByText(snippet)).toBeVisible();
  }

  async expectTag(tag: string): Promise<void> {
    await expect(this.page.getByText(tag, { exact: true })).toBeVisible();
  }
}
