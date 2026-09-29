import axios, { type AxiosInstance } from "axios";

export type HttpClientErrorDetails = Record<string, unknown>;

export class HttpClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details: HttpClientErrorDetails,
  ) {
    super(message);
    this.name = "HttpClientError";
  }
}

export type HttpClient = {
  post<T>(path: string, body: object): Promise<T>;
};

export function createHttpClient({ baseUrl }: { baseUrl: string }): HttpClient {
  const client: AxiosInstance = axios.create({ baseURL: baseUrl });

  return {
    async post<T>(path: string, body: object): Promise<T> {
      try {
        const response = await client.post<T>(path, body);
        return response.data;
      } catch (cause) {
        if (!axios.isAxiosError(cause)) throw cause;
        const details = (cause.response?.data ?? {}) as HttpClientErrorDetails;
        throw new HttpClientError(
          String(details.message ?? cause.message),
          String(details.error ?? "HTTP_REQUEST_FAILED"),
          cause.response?.status ?? 0,
          details,
        );
      }
    },
  };
}
