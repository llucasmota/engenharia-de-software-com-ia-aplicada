import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { getMongoDBTool } from "../tools/mongodbTool.ts";
import { getCSVTOJSONTool } from "../tools/csvToJSONTools.ts";
import { getFSTool } from "../tools/fsTool.ts";

export const getMCPTools = async () => {
  const cliente = new MultiServerMCPClient({
    mcpServers: {
      ...getMongoDBTool(),
      ...getFSTool()
    },
    onMessage: (log, source) => {
      console.log(`[${source.server} ${log.data}]`);
    },
  });


  const mcpTools = await cliente.getTools()
  return [
    ...mcpTools,
    getCSVTOJSONTool()
  ];
};
