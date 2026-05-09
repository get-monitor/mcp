import { GetMonitorApiError } from '../client/api-client.js';

export type ToolResponse = { content: Array<{ type: 'text'; text: string }> };

export function text(t: string): ToolResponse {
  return { content: [{ type: 'text', text: t }] };
}

export async function callApi<T>(fn: () => Promise<T>): Promise<ToolResponse> {
  try {
    const data = await fn();
    return text(data === undefined ? '' : JSON.stringify(data, null, 2));
  } catch (e) {
    if (e instanceof GetMonitorApiError)
      return text(`Error ${e.status}: ${JSON.stringify(e.body)}`);
    throw e;
  }
}
