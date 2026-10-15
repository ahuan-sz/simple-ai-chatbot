import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import "dotenv/config"

const client = new Client({
  name: "lwss",
  version: "1.0.0"
})
const transport = new StreamableHTTPClientTransport(new URL(`${process.env.MCP_BASE_URL}/WebSearch/mcp`), {
  requestInit: {
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    }
  }
})
await client.connect(transport)
const toolList = await client.listTools()
console.log(toolList)

const result = await client.callTool({
  name: "bailian_web_search",
  arguments: {
    query: "深圳天气如何？"
  }
})
console.log(result)
