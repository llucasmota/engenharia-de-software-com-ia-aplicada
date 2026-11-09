// Configuração a partir do .env desta pasta.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";
import { precoDoModelo } from "./precos.ts";

export const RAIZ = join(import.meta.dirname, "..");

export interface Config {
  porta: number;
  jevModelo: string;
  /** US$ por milhão de tokens de entrada. */
  precoEntrada: number;
}

/**
 * Carrega jev-guardinha/.env (se existir). O que está no arquivo vale mais do que o
 * ambiente herdado do terminal: assim a demo roda igual em qualquer terminal.
 */
export function carregarEnv(): void {
  const arq = join(RAIZ, ".env");
  if (!existsSync(arq)) return;
  for (const [chave, valor] of Object.entries(parseEnv(readFileSync(arq, "utf8")))) {
    // Linha vazia (ex.: "TYPESAFE_API_KEY=" copiada do exemplo) não apaga o que veio do terminal.
    if (valor !== undefined && valor.trim() !== "") process.env[chave] = valor;
  }
}

/** Variável herdada que muda para onde o SDK manda as requisições. */
export function avisosAmbiente(env: NodeJS.ProcessEnv): string[] {
  return env.TYPESAFE_BASE_URL?.trim()
    ? ["Atenção: TYPESAFE_BASE_URL está definida; o SDK vai usar esse endereço em vez do padrão."]
    : [];
}

function numero(env: NodeJS.ProcessEnv, nome: string, padrao: number, valido: (n: number) => boolean): number {
  const bruto = env[nome];
  if (bruto === undefined || bruto.trim() === "") return padrao;
  const n = Number(bruto.replace(",", "."));
  if (!Number.isFinite(n) || !valido(n)) throw new Error(`Valor inválido em ${nome}: "${bruto}"`);
  return n;
}

export function lerConfig(env: NodeJS.ProcessEnv): Config {
  const jevModelo = (env.JEV_MODEL ?? "").trim() || "jev-1.13.0";
  const sobrescrita = env.PRECO_JEV_ENTRADA?.trim() ? numero(env, "PRECO_JEV_ENTRADA", 0, (n) => n >= 0) : undefined;
  return {
    porta: numero(env, "PORTA", 3000, (n) => Number.isInteger(n) && n > 0 && n < 65536),
    jevModelo,
    precoEntrada: precoDoModelo(jevModelo, sobrescrita),
  };
}
