import { Global, Module } from "@nestjs/common";
import { createHttpClient, type HttpClient } from "./client.ts";

export const INVENTORY_HTTP_CLIENT = Symbol("INVENTORY_HTTP_CLIENT");
export const BILLING_HTTP_CLIENT = Symbol("BILLING_HTTP_CLIENT");
export const SHIPPING_HTTP_CLIENT = Symbol("SHIPPING_HTTP_CLIENT");

function serviceUrl(name: "INVENTORY" | "BILLING" | "SHIPPING", fallbackPort: number): string {
  return process.env[`${name}_URL`] ?? `http://localhost:${fallbackPort}`;
}

const providers = [
  { provide: INVENTORY_HTTP_CLIENT, useFactory: (): HttpClient => createHttpClient({ baseUrl: serviceUrl("INVENTORY", 3001) }) },
  { provide: BILLING_HTTP_CLIENT, useFactory: (): HttpClient => createHttpClient({ baseUrl: serviceUrl("BILLING", 3002) }) },
  { provide: SHIPPING_HTTP_CLIENT, useFactory: (): HttpClient => createHttpClient({ baseUrl: serviceUrl("SHIPPING", 3003) }) },
];

@Global()
@Module({
  providers,
  exports: providers,
})
export class HttpClientsModule {}
