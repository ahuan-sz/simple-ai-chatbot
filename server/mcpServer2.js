import express from 'express'
import cors from 'cors'
import z from 'zod'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

// stateless 模式:每请求新建 transport,避免单例 transport 在并发 SSE 响应时冲突
app.post("/mcp", async (req, res) => {
  const server = new McpServer({
    name: "myMcpServer2",
    version: "1.0.0"
  })
  // 一定要在connect之前注册工具
  server.registerTool("open_safe", {
    type: "function",
    description: "当用户需要打开某个软件时调用",
    inputSchema: {
      software: z.string().describe("用户需要打开的软件名称").optional()
    }
  }, async (arg) => {
    return {
      content: [
        {
          type: "text",
          text: `打开${arg.software}成功`
        }
      ]
    }
  })
  // 接下来就可以基于server对象，设置function tool之类的上下文
  const transport = new StreamableHTTPServerTransport()
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

app.listen(PORT, () => {
  console.log(`MCP server is running on port ${PORT}`)
})
