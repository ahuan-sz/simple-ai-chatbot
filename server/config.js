import "dotenv/config"

export const mcpList = [
  {
    name: "myMcpServer1",
    type: "streamableHttp",
    url: "http://localhost:3001/mcp"
  },
  {
    name: "myMcpServer2",
    type: "streamableHttp",
    url: "http://localhost:3002/mcp"
  },
  {
    name: "web_search",
    type: "streamableHttp",
    url: `${process.env.MCP_BASE_URL}/WebSearch/mcp`,
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    }
  },
  {
    name: "chrome_dev_tools",
    type: "stdio",
    commandArg: {
      command: "npx",
      args: [
        "chrome-devtools-mcp@latest",
        "--headless=true",
        "--channel=canary",
        "--isolated=true"
      ],
    }
  }
]