import { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiError } from '../errors/api.error';

export type ApiRequestOptions = {
  params?: Record<string, string>;
  headers?: Record<string, string>;
  timeout?: number;
};

export class BaseApi {
  constructor(protected client: APIRequestContext) {}

  protected async get<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    const response = await this.client.get(url, options);

    return this.parseResponse<T>(response, `GET ${url} failed`);
  }

  protected async post<T>(
    url: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<T> {
    const response = await this.client.post(url, {
      data,
      ...options,
    });

    return this.parseResponse<T>(response, `POST ${url} failed`);
  }

  protected async patch<T>(
    url: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<T> {
    const response = await this.client.patch(url, {
      data,
      ...options,
    });

    return this.parseResponse<T>(response, `PATCH ${url} failed`);
  }

  protected async put<T>(
    url: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<T> {
    const response = await this.client.put(url, {
      data,
      ...options,
    });

    return this.parseResponse<T>(response, `PUT ${url} failed`);
  }

  protected async delete(
    url: string,
    options?: ApiRequestOptions,
  ): Promise<void> {
    const response = await this.client.delete(url, options);

    await this.assertOk(response, `DELETE ${url} failed`);
  }

  private async parseResponse<T>(
    response: APIResponse,
    errorMessage: string,
  ): Promise<T> {
    await this.assertOk(response, errorMessage);

    const text = await response.text();

    // 204 No Content
    if (!text) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError('Invalid JSON response', response.status(), text);
    }
  }

  private async assertOk(
    response: APIResponse,
    message: string,
  ): Promise<void> {
    if (response.ok()) {
      return;
    }

    const body = await response.text();

    throw new ApiError(message, response.status(), body);
  }
}
