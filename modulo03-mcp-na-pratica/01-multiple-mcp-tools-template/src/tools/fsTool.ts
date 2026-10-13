// {
//   "mcpServers": {
//     "filesystem": {
//       "command": "npx",
//         "args": [
//           "-y",
//           "@modelcontextprotocol/server-filesystem",
//           "/Users/username/Desktop",
//           "/path/to/other/allowed/dir"
//         ]
//     }
//   }
// }

export const getFSTool = () => {
  return {
    filesystem: {
      transport: "stdio" as const,
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        `${process.cwd()}/reports`,
      ]
    }
  }
}
