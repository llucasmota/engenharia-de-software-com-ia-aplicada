// O contador da sessão, recalculado com os limiares atuais (mexeu no slider, o placar acompanha).
import { decidir, type Limiares, type Motivo, type Sinais } from "./guardinha.ts";

/** Uma mensagem já respondida pelo Jev. */
export interface Registro {
  id: number;
  sinais: Sinais;
  tokensEntrada: number;
  custoUSD: number;
  latenciaMs: number;
}

export interface Placar {
  mensagens: number;
  liberadas: number;
  /** Chamadas ao LLM evitadas, por motivo. */
  bloqueadas: Record<Motivo, number>;
  tokensEntrada: number;
  custoUSD: number;
  latenciaMediaMs: number | null;
  /** Custo médio por mensagem × 1 milhão (null sem mensagens). */
  custoPorMilhao: number | null;
}

export function calcularPlacar(registros: readonly Registro[], limiares: Limiares): Placar {
  const bloqueadas: Record<Motivo, number> = { jailbreak: 0, spam: 0, "fora do escopo": 0, incerto: 0 };
  let liberadas = 0;
  for (const r of registros) {
    const v = decidir(r.sinais, limiares);
    if (v.liberado) liberadas++;
    else bloqueadas[v.motivo]++;
  }
  const n = registros.length;
  const soma = (f: (r: Registro) => number) => registros.reduce((t, r) => t + f(r), 0);
  const custo = soma((r) => r.custoUSD);
  return {
    mensagens: n,
    liberadas,
    bloqueadas,
    tokensEntrada: soma((r) => r.tokensEntrada),
    custoUSD: custo,
    latenciaMediaMs: n > 0 ? Math.round(soma((r) => r.latenciaMs) / n) : null,
    custoPorMilhao: n > 0 ? (custo / n) * 1_000_000 : null,
  };
}
