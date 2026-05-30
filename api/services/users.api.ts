import { APIResponse } from '@playwright/test';
import { BaseApi } from '../core/baseApi';
import { CreateUserRequest, UserResponse } from '../models/user.model';

export class UsersApi extends BaseApi {
  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    return this.post<UserResponse>('/users', data);
  }

  async getUser(id: number): Promise<UserResponse> {
    return this.get<UserResponse>(`/users/${id}`);
  }

  /**
   * Negative-path variants: return the raw response instead of throwing, so
   * tests can assert on error status codes and bodies directly.
   */
  async tryCreateUser(data: Partial<CreateUserRequest>): Promise<APIResponse> {
    return this.client.post('/users', { data });
  }

  async tryGetUser(id: number): Promise<APIResponse> {
    return this.client.get(`/users/${id}`);
  }

  async getUsers(): Promise<UserResponse[]> {
    return this.get<UserResponse[]>('/users');
  }

  async updateUser(
    id: number,
    data: Partial<CreateUserRequest>,
  ): Promise<UserResponse> {
    return this.patch<UserResponse>(`/users/${id}`, data);
  }

  async deleteUser(id: number): Promise<void> {
    return this.delete(`/users/${id}`);
  }
}
