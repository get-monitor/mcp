// src/client/api-client.ts

export interface ClientOptions {
  baseUrl: string;
  token?: string;  // optional — GET endpoints are public
}

export class GetMonitorApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'GetMonitorApiError';
  }
}

export class GetMonitorClient {
  private readonly baseUrl: string;
  private readonly token: string | undefined;

  constructor(opts: ClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.token = opts.token;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  }

  async get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
    const url = new URL(this.baseUrl + path);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, v);
      }
    }
    const res = await fetch(url.toString(), { headers: this.headers() });
    return this.parse<T>(res);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    return this.parse<T>(res);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    return this.parse<T>(res);
  }

  async delete<T = void>(path: string): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method: 'DELETE',
      headers: this.headers(),
    });
    return this.parse<T>(res);
  }

  private async parse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new GetMonitorApiError(`GetMonitor API error ${res.status}`, res.status, body);
    }
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined as T;
    }
    return res.json() as Promise<T>;
  }
}
