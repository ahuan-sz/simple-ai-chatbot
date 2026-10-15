#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
  
import { exec } from 'child_process'

const server = new McpServer({
  name: "myMcpServer",
  version: "1.0.0"
})
server.registerTool("open_postman", {
  description: "打开用户本地的Postman软件",
}, () => {
  // 通过js打开用户本地的postman
  // 打开本地postman软件，mac系统
  exec('open -a Postman', (err) => {
    if (err) {
      console.error('启动postman失败')
    }
  })
  return {
    content: [
      {
        type: "text",
        text: "Postman已打开"
      }
    ]
  }
})
const transport = new StdioServerTransport()
await server.connect(transport)
