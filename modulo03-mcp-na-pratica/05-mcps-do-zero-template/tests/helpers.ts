import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { version } from "os";


export async function creatTestClient() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [
      'src/index.ts']
  })

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  })

  await client.connect(transport);
  return client;
}