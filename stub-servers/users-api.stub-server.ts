import http from 'http';
import { CreateUserRequest, UserResponse } from '@api/models/user.model';
import { BaseStubServer } from './base.stub-server';

export class UsersApiStubServer extends BaseStubServer {
  protected readonly label = 'Users API';
  private users = new Map<number, UserResponse>();
  private nextId = 1;

  constructor() {
    super();
    this.seedUser({
      firstName: 'Seed',
      lastName: 'User',
      email: 'seed@test.com',
      password: 'seeded',
    });
  }

  private validateUserPayload(
    payload: Partial<CreateUserRequest>,
  ): Record<string, string> {
    const requiredFields: (keyof CreateUserRequest)[] = [
      'firstName',
      'lastName',
      'email',
      'password',
    ];

    const errors: Record<string, string> = {};

    for (const field of requiredFields) {
      if (!payload[field]) {
        errors[field] = `${field} is required`;
      }
    }

    if (payload.email && !this.isValidEmail(payload.email)) {
      errors.email = 'email is invalid';
    }

    return errors;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private seedUser(data: CreateUserRequest): UserResponse {
    const id = this.nextId++;
    const user: UserResponse = {
      id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    };
    this.users.set(id, user);
    return user;
  }

  protected handle(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = req.url ?? '';
    const method = req.method ?? 'GET';

    const userIdMatch = url.match(/^\/users\/(\d+)$/);

    if (method === 'POST' && url === '/users') {
      this.readBody(req, res, (body) => {
        const payload = body as Partial<CreateUserRequest>;
        const errors = this.validateUserPayload(payload);

        if (Object.keys(errors).length > 0) {
          this.send(res, 400, { message: 'Invalid user payload', errors });
          return;
        }

        const created = this.seedUser(payload as CreateUserRequest);
        this.send(res, 201, created);
      });
      return;
    }

    if (method === 'GET' && url === '/users') {
      this.send(res, 200, Array.from(this.users.values()));
      return;
    }

    if (method === 'GET' && userIdMatch) {
      const id = Number(userIdMatch[1]);
      const user = this.users.get(id);
      if (!user) {
        this.send(res, 404, { message: 'User not found' });
        return;
      }
      this.send(res, 200, user);
      return;
    }

    if (method === 'DELETE' && userIdMatch) {
      const id = Number(userIdMatch[1]);
      if (!this.users.has(id)) {
        this.send(res, 404, { message: 'User not found' });
        return;
      }
      this.users.delete(id);
      this.sendNoContent(res);
      return;
    }

    this.send(res, 404, { message: 'Not found' });
  }
}
