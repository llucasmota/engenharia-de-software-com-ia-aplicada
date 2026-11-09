// Preço do Jev e a conta do custo.
//
// Fonte (consultada em 22/10/2026): https://docs.typesafe.ai/models.md
//   "You pay per input token. Output tokens are free."
// Para um modelo fora da tabela, defina PRECO_JEV_ENTRADA no .env.

export const FONTE_PRECO = "https://docs.typesafe.ai/models.md";

/** US$ por milhão de tokens de ENTRADA. A saída é grátis. */
export const PRECOS: Readonly<Record<string, number>> = {
  "jev-1.13.0": 0.042,
  "jev-1.14.0": 0.042,
  // Apelidos: jev-latest aponta hoje para 1.13.0 e jev-preview para 1.14.0.
  "jev-latest": 0.042,
  "jev-preview": 0.042,
};

export function precoDoModelo(modelo: string, sobrescrita?: number): number {
  if (sobrescrita !== undefined) return sobrescrita;
  const preco = PRECOS[modelo];
  if (preco === undefined) {
    throw new Error(`Não sei o preço de "${modelo}". Defina PRECO_JEV_ENTRADA (US$ por milhão de tokens) no .env.`);
  }
  return preco;
}

/** custo (US$) = tokens de entrada × preço por milhão / 1.000.000 */
export function custoUSD(tokensEntrada: number, precoPorMilhao: number): number {
  return (tokensEntrada * precoPorMilhao) / 1_000_000;
}
