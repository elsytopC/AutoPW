import { APIResponse } from '@playwright/test';
import { BaseApi } from '../core/baseApi';
import {
  CreateUserRequest,
  UserResponse,
  userResponseSchema,
  usersResponseSchema,
} from '../models/user.model';

export class UsersApi extends BaseApi {
  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    const body = await this.post<unknown>('/users', data);
    return userResponseSchema.parse(body);
  }

  async getUser(id: number): Promise<UserResponse> {
    const body = await this.get<unknown>(`/users/${id}`);
    return userResponseSchema.parse(body);
  }

  async tryCreateUser(data: Partial<CreateUserRequest>): Promise<APIResponse> {
    return this.client.post('/users', { data });
  }

  async tryGetUser(id: number): Promise<APIResponse> {
    return this.client.get(`/users/${id}`);
  }

  async getUsers(): Promise<UserResponse[]> {
    const body = await this.get<unknown>('/users');
    return usersResponseSchema.parse(body);
  }

  async updateUser(
    id: number,
    data: Partial<CreateUserRequest>,
  ): Promise<UserResponse> {
    const body = await this.patch<unknown>(`/users/${id}`, data);
    return userResponseSchema.parse(body);
  }

  async deleteUser(id: number): Promise<void> {
    return this.delete(`/users/${id}`);
  }
}
