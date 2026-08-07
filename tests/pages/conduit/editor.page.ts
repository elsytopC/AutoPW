import { Page } from '@playwright/test';
import { CreateArticleRequest } from '@api/conduit';
import { ConduitBasePage } from './base-conduit.page';

/** `/editor` — compose and publish a new article (auth required). */
export class ConduitEditorPage extends ConduitBasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/editor');
  }

  /**
   * Fills all fields and clicks Publish. Tags are added one-by-one with Enter
   * because the Angular tag input only commits a tag on keypress.
   * After publish the router navigates to `/article/{slug}`.
   */
  async publishArticle(data: CreateArticleRequest): Promise<void> {
    await this.page.getByPlaceholder('Article Title').fill(data.title);
    await this.page
      .getByPlaceholder("What's this article about?")
      .fill(data.description);
    await this.page
      .getByPlaceholder('Write your article (in markdown)')
      .fill(data.body);

    if (data.tagList?.length) {
      const tagInput = this.page.getByPlaceholder('Enter tags');
      for (const tag of data.tagList) {
        await tagInput.fill(tag);
        await tagInput.press('Enter');
      }
    }

    await this.page.getByRole('button', { name: 'Publish Article' }).click();
  }
}
