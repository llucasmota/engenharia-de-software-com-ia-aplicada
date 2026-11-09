// Servidor da demo: node:http puro, uma página estática e três rotas JSON.
// O ponto de entrada (linha de comando) fica em src/iniciar.ts.
import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { join } from "node:path";
import type { TypeSafeClient } from "@typesafe-ai/sdk";
import { RAIZ, type Config } from "./config.ts";
import { consultarGuardinha, decidir, LIMIARES_PADRAO, PERGUNTAS, RESPOSTA_PADRAO, type Limiares } from "./guardinha.ts";
import { descreverErroJev } from "./jev.ts";
import { calcularPlacar, type Registro } from "./placar.ts";
import { custoUSD, FONTE_PRECO } from "./precos.ts";

export interface OpcoesServidor {
  cfg: Config;
  /** Cliente do Jev. */
  jev: TypeSafeClient;
  host?: string;
}

class ErroDoCliente extends Error {}

/** Limiares vindos da página: cada um entre 0 e 1; o que faltar fica no padrão. */
export function lerLimiares(bruto: unknown): Limiares {
  const limiares = { ...LIMIARES_PADRAO };
  if (bruto === undefined || bruto === null) return limiares;
  if (typeof bruto !== "object") throw new ErroDoCliente("limiares deve ser um objeto");
  for (const chave of Object.keys(limiares) as (keyof Limiares)[]) {
    const valor = (bruto as Record<string, unknown>)[chave];
    if (valor === undefined) continue;
    if (typeof valor !== "number" || !(valor >= 0 && valor <= 1)) {
      throw new ErroDoCliente(`limiar "${chave}" deve ser um número entre 0 e 1`);
    }
    limiares[chave] = valor;
  }
  return limiares;
}

async function lerJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  let corpo = "";
  for await (const parte of req) {
    corpo += parte;
    if (corpo.length > 20_000) throw new ErroDoCliente("corpo grande demais");
  }
  try {
    return corpo ? (JSON.parse(corpo) as Record<string, unknown>) : {};
  } catch {
    throw new ErroDoCliente("JSON inválido");
  }
}

function responder(res: ServerResponse, status: number, dados: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(dados));
}

export function criarServidor({ cfg, jev, host = "127.0.0.1" }: OpcoesServidor) {
  /** As mensagens da sessão, na ordem em que chegaram. */
  let registros: Registro[] = [];
  let proximoId = 1;

  async function novaMensagem(corpo: Record<string, unknown>) {
    const texto = typeof corpo.texto === "string" ? corpo.texto.trim() : "";
    if (!texto) throw new ErroDoCliente("mande um texto");
    if (texto.length > 4000) throw new ErroDoCliente("texto grande demais (máx. 4000 caracteres)");
    const limiares = lerLimiares(corpo.limiares);

    const { request, resposta, latenciaMs } = await consultarGuardinha(jev, texto, cfg.jevModelo);
    const tokensEntrada = resposta.usage.input_tokens ?? 0;
    const registro: Registro = {
      id: proximoId++,
      sinais: resposta.answers,
      tokensEntrada,
      custoUSD: custoUSD(tokensEntrada, cfg.precoEntrada),
      latenciaMs,
    };
    registros.push(registro);

    const veredito = decidir(resposta.answers, limiares);
    return {
      ...registro,
      texto,
      modelo: resposta.model,
      tokensInformados: resposta.usage.input_tokens !== null,
      veredito,
      // Liberado: aqui entraria a chamada ao LLM. Bloqueado: a Lia responde isto e o LLM nem é chamado.
      respostaLia: veredito.liberado ? null : RESPOSTA_PADRAO,
      request,
      resposta,
      placar: calcularPlacar(registros, limiares),
    };
  }

  const servidor = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const rota = `${req.method} ${url.pathname}`;
    try {
      if (rota === "GET /" || rota === "GET /index.html") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
        res.end(readFileSync(join(RAIZ, "public", "index.html")));
      } else if (rota === "GET /api/info") {
        responder(res, 200, {
          modelo: cfg.jevModelo,
          precoEntrada: cfg.precoEntrada,
          fontePreco: FONTE_PRECO,
          limiares: LIMIARES_PADRAO,
          respostaPadrao: RESPOSTA_PADRAO,
          perguntas: PERGUNTAS,
        });
      } else if (rota === "POST /api/mensagem") {
        const corpo = await lerJson(req);
        try {
          responder(res, 200, await novaMensagem(corpo));
        } catch (e) {
          if (e instanceof ErroDoCliente) throw e;
          responder(res, 502, { erro: descreverErroJev(e) });
        }
      } else if (rota === "POST /api/limiares") {
        // Mexeu no slider: refaz o veredito de todas as mensagens SEM chamar o Jev de novo.
        const limiares = lerLimiares((await lerJson(req)).limiares);
        responder(res, 200, {
          vereditos: registros.map((r) => ({ id: r.id, veredito: decidir(r.sinais, limiares) })),
          placar: calcularPlacar(registros, limiares),
        });
      } else if (rota === "POST /api/reiniciar") {
        registros = [];
        responder(res, 200, { placar: calcularPlacar(registros, LIMIARES_PADRAO) });
      } else {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        res.end("não encontrado");
      }
    } catch (e) {
      responder(res, e instanceof ErroDoCliente ? 400 : 500, { erro: e instanceof Error ? e.message : String(e) });
    }
  });

  return {
    servidor,
    escutar: (porta: number) =>
      new Promise<number>((ok) => {
        servidor.listen(porta, host, () => {
          const endereco = servidor.address();
          ok(typeof endereco === "object" && endereco ? endereco.port : porta);
        });
      }),
    fechar: () => new Promise<void>((ok) => servidor.close(() => ok())),
  };
}
