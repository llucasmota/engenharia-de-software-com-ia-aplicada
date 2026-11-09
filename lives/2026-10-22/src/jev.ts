// Cliente do Jev (TypeSafe "System One") e mensagens de erro curtas para a tela.
import {
  APIConnectionError,
  APIError,
  AuthenticationError,
  BadRequestError,
  RateLimitError,
  TypeSafeClient,
} from "@typesafe-ai/sdk";

/** Sem `apiKey`, o SDK lê TYPESAFE_API_KEY do ambiente. */
export function criarClienteJev(opcoes: { modelo: string; apiKey?: string }): TypeSafeClient {
  return new TypeSafeClient({
    ...(opcoes.apiKey ? { apiKey: opcoes.apiKey } : {}),
    defaultModel: opcoes.modelo,
    timeout: 30_000,
  });
}

export function descreverErroJev(e: unknown): string {
  if (e instanceof AuthenticationError) return "chave da TypeSafe inválida (401)";
  if (e instanceof RateLimitError) return "limite de taxa (429)";
  if (e instanceof BadRequestError) return `requisição inválida (400): ${e.message}`;
  if (e instanceof APIError) return `erro da API ${e.status}: ${e.message}`;
  if (e instanceof APIConnectionError) return "sem conexão com a API da TypeSafe";
  return e instanceof Error ? e.message : String(e);
}
