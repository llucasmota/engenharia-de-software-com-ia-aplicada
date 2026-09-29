import { MultiServerMCPClient } from "@langchain/mcp-adapters";

export const getMcpTools = async () => {
  const mcpClient = new MultiServerMCPClient({
    // [filesystem] se refere ao nome que quero dar a esse mcp
    filesystem: {
      transport: 'stdio', // como navegar a info(prompt)
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        process.cwd()
      ]
    }
  })
  return mcpClient.getTools();
}

