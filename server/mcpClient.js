import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { transformToOpenAi } from './utils/utils.js'

// 重写fetch，让整个项目通过fetch发请求的时候打印一些东西
const originalFetch = global.fetch;
global.fetch = async (url, init) => {
  console.log('[MCP DEBUG] fetch', url, init)
  return originalFetch(url, init)
}

const client = new Client({
  name: "myMcpClient",
  version: "1.0.0"
})

const transport = new StreamableHTTPClientTransport("http://localhost:3001/mcp")

await client.connect(transport)

// const result = await client.listTools()
// transformToOpenAi(result)
// const callResult = await client.callTool({
//   name: "help_dp",
//   arguments: {
//     city: "北京"
//   }
// })
// console.log(JSON.stringify(callResult))

// const resourceList = await client.listResources()
// console.log(resourceList)
// const resourceResult = await client.readResource({
//   uri: "text://gsgzzd.txt"
// })
// console.log(resourceResult)

const promptList = await client.listPrompts()
console.log(promptList)
const promptResult = await client.getPrompt({
  name: "通用上下文",
  arguments: {
    role: "资深前端工程师",
    input: "需要提问前端相关的问题",
    output: "有必要的时候，最好能提供代码辅助解释"
  }
})
console.log(JSON.stringify(promptResult))
