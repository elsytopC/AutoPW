import { Page } from '@playwright/test';
import { CreateArticleRequest } from '@api/conduit';
import { ConduitBasePage } from './base-conduit.page';

export class ConduitEditorPage extends ConduitBasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/editor');
  }

  /** Tag input commits each tag on Enter — fill + press per tag. */
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
