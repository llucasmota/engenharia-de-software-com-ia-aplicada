// Ponto de entrada: `npm start`, depois abra http://localhost:3000
import { avisosAmbiente, carregarEnv, lerConfig } from "./config.ts";
import { criarClienteJev } from "./jev.ts";
import { criarServidor } from "./server.ts";

async function main(): Promise<void> {
  carregarEnv();
  if (!process.env.TYPESAFE_API_KEY?.trim()) {
    throw new Error("Falta TYPESAFE_API_KEY no .env desta pasta (copie .env.example).");
  }
  const cfg = lerConfig(process.env);
  const jev = criarClienteJev({ modelo: cfg.jevModelo });
  const app = criarServidor({ cfg, jev, host: process.env.HOST ?? "127.0.0.1" });
  const porta = await app.escutar(cfg.porta);
  console.log(`Jev: ${cfg.jevModelo} (US$ ${cfg.precoEntrada} por milhão de tokens de entrada)`);
  for (const a of avisosAmbiente(process.env)) console.warn(a);
  console.log(`Abra http://localhost:${porta}`);
  const sair = () => void app.fechar().then(() => process.exit(0));
  process.on("SIGINT", sair);
  process.on("SIGTERM", sair);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
