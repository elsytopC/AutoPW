import http from 'http';
import { AddressInfo } from 'net';
import { CreateUserRequest, UserResponse } from '@api/models/user.model';

/**
 * Lightweight in-process HTTP server that emulates the Users API contract.
 * It lets API tests exercise the real UsersApi / BaseApi / ApiError code path
 * against deterministic responses, without depending on an external backend.
 */
export class MockApiServer {
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
      throw new Error('Mock server is not started');
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
      this.readBody(req, (body) => {
        const created = this.seedUser(body as CreateUserRequest);
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
      this.users.delete(id);
      res.writeHead(204);
      res.end();
      return;
    }

    this.send(res, 404, { message: 'Not found' });
  }

  private readBody(
    req: http.IncomingMessage,
    onParsed: (body: unknown) => void,
  ): void {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => onParsed(raw ? JSON.parse(raw) : {}));
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
