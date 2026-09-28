import http from 'http';
import { AddressInfo } from 'net';

export abstract class BaseStubServer {
  private server?: http.Server;

  protected abstract readonly label: string;

  get baseURL(): string {
    if (!this.server) {
      throw new Error(`${this.label} stub server is not started`);
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
    this.reset();
  }

  protected abstract handle(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): void;

  protected reset(): void {}

  protected errorBody(message: string): unknown {
    return { message };
  }

  protected readBody(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    onParsed: (body: unknown) => void,
  ): void {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('error', () => {
      this.send(res, 400, this.errorBody('Request stream error'));
    });
    req.on('end', () => {
      if (!raw) {
        onParsed({});
        return;
      }
      try {
        onParsed(JSON.parse(raw));
      } catch {
        this.send(res, 400, this.errorBody('Invalid JSON'));
      }
    });
  }

  protected send(
    res: http.ServerResponse,
    status: number,
    payload: unknown,
  ): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  }

  protected sendNoContent(res: http.ServerResponse): void {
    res.writeHead(204);
    res.end();
  }
}
