import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const client = new Client({
  name: "chrome-dev-tools",
  version: "1.0.0"
})
const transport = new StdioClientTransport({
  command: "npx",
  args: [
    "chrome-devtools-mcp@latest",
    "--headless=true",
    "--channel=canary",
    "--isolated=true"
  ],
})
await client.connect(transport)
const toolList = await client.listTools()
console.log(toolList)
const result = await client.callTool({
  name: "take_screenshot",
  arguments: {
    format: "png",
  }
})
console.log(result) 