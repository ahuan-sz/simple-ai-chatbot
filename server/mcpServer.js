import express from 'express'
import cors from 'cors'
import fs from 'fs'
import z, { output } from 'zod'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// stateless 模式:每请求新建 transport,避免单例 transport 在并发 SSE 响应时冲突
app.post("/mcp", async (req, res) => {
  const server = new McpServer({
    name: "myMcpServer1",
    version: "1.0.0"
  })
  // 一定要在connect之前注册工具
  server.registerTool("help_dp", {
    type: "function",
    description: "当用户需要订票的时候调用此工具",
    inputSchema: {
      city: z.string().describe("用户订票要去的城市").optional()
    }
  }, async (arg) => {
    return {
      content: [
        {
          type: "text",
          text: `去往${arg.city}的票，订购成功`
        }
      ]
    }
  })
  // mcp提供资源
  server.registerResource("pic1", "image://pic1.png", {
    title: "示例图片",
    description: "这是一个示例图片",
    mineType: "image/png"
  }, async (uri) => {
    // 读取对应资源返回给客户端
    const url = uri.href.replace("image://", "./img/")
    const buf = fs.readFileSync(url)
    fs.writeFileSync("./t.txt", buf.toString("base64"))
    return {
      contents: [
        {
          uri: "image://pic1.png",
          blob: buf.toString("base64")
        }
      ]
    }
  })
  server.registerResource("gsgzzd", "text://gsgzzd.txt", {
    title: "公司制度文档",
    description: "这是一个公司制度文档",
    mineType: "text/plain"
  }, async (uri) => {
    // 读取对应资源返回给客户端
    const url = uri.href.replace("text://", "./doc/")
    const buf = fs.readFileSync(url)
    return {
      contents: [
        {
          uri: "text://gsgzzd.txt",
          text: buf.toString()
        }
      ]
    }
  })
  server.registerPrompt("通用上下文", {
    title: "通用上下文",
    description: "这是一个通用上下文",
    argsSchema: {
      role: z.string().describe("角色").default("user"),
      input: z.string().describe("输入"),
      output: z.string().describe("输出")
    }
  }, (arg) => {
    const { role, input, output } = arg
    const buf = fs.readFileSync("./prompt.md")
    const bufString = buf.toString()
    const _bufString = bufString.replace("${role}", role).replace("${input}", input).replace("${output}", output)
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: _bufString
          }
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
