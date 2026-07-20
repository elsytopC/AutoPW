import http from 'http';
import { AddressInfo } from 'net';
import { CreateUserRequest, UserResponse } from '@api/models/user.model';

/**
 * Lightweight in-process HTTP server that emulates the Users API contract.
 * It lets API tests exercise the real UsersApi / BaseApi / ApiError code path
 * against deterministic responses, without depending on an external backend.
 */
export class UsersApiStubServer {
  private server?: http.Server;
  private users = new Map<number, UserResponse>();
  private nextId = 1;

  constructor() {
    this.seedUser({
      firstName: 'Seed',
      lastName: 'User',
      email: 'seed@test.com',
      password: 'seeded',
    });
  }

  get baseURL(): string {
    if (!this.server) {
      throw new Error('Users API stub server is not started');
    }
    const { port } = this.server.address() as AddressInfo;
    return `http://127.0.0.1:${port}`;
  }

  async start(): Promise<void> {
    this.server = http.createServer((req, res) => this.handle(req, res));
    await new Promise<void>((resolve) => {
      this.server!.listen(0, '127.0.0.1', resolve);
    });
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      this.server!.close((err) => (err ? reject(err) : resolve()));
    });
    this.server = undefined;
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

  private handle(req: http.IncomingMessage, res: http.ServerResponse): void {
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
      res.writeHead(204);
      res.end();
      return;
    }

    this.send(res, 404, { message: 'Not found' });
  }

  private readBody(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    onParsed: (body: unknown) => void,
  ): void {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('error', () => {
      this.send(res, 400, { message: 'Request stream error' });
    });
    req.on('end', () => {
      if (!raw) {
        onParsed({});
        return;
      }
      try {
        onParsed(JSON.parse(raw));
      } catch {
        this.send(res, 400, { message: 'Invalid JSON' });
      }
    });
  }

  private send(
    res: http.ServerResponse,
    status: number,
    payload: unknown,
  ): void {
    const body = JSON.stringify(payload);
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(body);
  }
}

/** @deprecated Use UsersApiStubServer */
export { UsersApiStubServer as MockApiServer };
