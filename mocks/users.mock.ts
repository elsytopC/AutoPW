import { CreateUserRequest, UserResponse } from '../api/models/user.model';

export class UsersMock {
  static async createUser(data: CreateUserRequest): Promise<UserResponse> {
    return {
      id: 1,
      ...data,
    };
  }

  static async mockGetUser(id: number): Promise<{
    status: number;
    body: unknown;
  }> {
    if (id === 999999) {
      return {
        status: 404,
        body: {
          message: 'User not found',
        },
      };
    }

    return {
      status: 200,
      body: {
        id,
        firstName: 'Mock',
        lastName: 'User',
        email: 'mock@test.com',
      },
    };
  }

  static async getUsers(): Promise<UserResponse[]> {
    return [
      {
        id: 1,
        firstName: 'Mock',
        lastName: 'User',
        email: 'mock@test.com',
      },
    ];
  }

  static async deleteUser(): Promise<void> {
    return;
  }
}
