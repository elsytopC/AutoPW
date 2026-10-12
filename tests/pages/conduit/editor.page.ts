import { Page } from '@playwright/test';
import { CreateArticleRequest } from '@api/conduit';
import { step } from '@utils/step';
import { ConduitBasePage } from './base-conduit.page';

export class ConduitEditorPage extends ConduitBasePage {
  constructor(page: Page) {
    super(page);
  }

  @step('Open article editor')
  async goto(): Promise<void> {
    await this.navigate('/editor');
  }

  /** Tag input commits each tag on Enter — fill + press per tag. */
  @step('Publish article "{0.title}"')
  async publishArticle(data: CreateArticleRequest): Promise<void> {
    await this.fill(this.page.getByPlaceholder('Article Title'), data.title);
    await this.fill(
      this.page.getByPlaceholder("What's this article about?"),
      data.description,
    );
    await this.fill(
      this.page.getByPlaceholder('Write your article (in markdown)'),
      data.body,
    );

    if (data.tagList?.length) {
      const tagInput = this.page.getByPlaceholder('Enter tags');
      for (const tag of data.tagList) {
        await this.fill(tagInput, tag);
        await tagInput.press('Enter');
      }
    }

    await this.page.getByRole('button', { name: 'Publish Article' }).click();
  }
}
