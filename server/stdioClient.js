import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const client = new Client({
  name: "myMcpClient",
  version: "1.0.0"
})

const transport = new StdioClientTransport({
  command: "myLocalMcp",
})

client.connect(transport)
const listToolResult = await client.listTools()
console.log(listToolResult)
const callResult = await client.callTool({
  name: "open_postman",
})
console.log(callResult)
