import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.ts";
import { waitForTemporal } from "./temporal/temporal.runtime.ts";

await waitForTemporal();
const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();
const port = Number(process.env.PORT ?? 3000);
await app.listen(port);
console.log(`Process Manager listening on http://localhost:${port}`);
