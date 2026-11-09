import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./mcp.ts";

async function main() {
    const tranbsport = new StdioServerTransport();
    await server.connect(tranbsport);
    console.error('Encrypt MCP Seever running on stdio')
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});