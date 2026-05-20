import { BaseApi } from '../core/baseApi';
import { CreateUserRequest, UserResponse } from '../models/user.model';

export class UsersApi extends BaseApi {
  async createUser(data: CreateUserRequest): Promise<UserResponse> {
    return this.post<UserResponse>('/users', data);
  }

  async getUser(id: number): Promise<UserResponse> {
    return this.get<UserResponse>(`/users/${id}`);
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
