/// <reference path="./json-server.d.ts" />

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createApp } from "json-server/lib/app.js";

export type MockDatabase = {
  data: Record<string, unknown>;
  write: () => Promise<void>;
};

export type MockRoute = (
  request: IncomingMessage,
  response: ServerResponse,
) => boolean | Promise<boolean>;

export function respond(
  response: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(body));
}

export async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

export function createMockServer({
  database,
  port,
  route,
}: {
  database: MockDatabase;
  port: number;
  route: MockRoute;
}) {
  const jsonServerApp = createApp(database);
  const server = createServer(async (request, response) => {
    if (await route(request, response)) return;
    jsonServerApp.attach(request, response);
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`Mock server listening on http://localhost:${port}`);
  });

  return server;
}
