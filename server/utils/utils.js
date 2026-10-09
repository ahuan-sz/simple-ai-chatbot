import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { mcpList } from "../config.js"

// ESM 下 __dirname 不再自动注入,需手动构造
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const systemContext = fs.readFileSync(path.resolve(__dirname, "../context/context2.md"), "utf-8")
const systemString = systemContext.toString()
import { toolHandleMap, toolList, frontList } from "./tools.js";
import { textSearch } from "../vector/index.js";

export async function summaryMessage(openai, messageList) {
  const llmres = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: "帮我总结下面的对话记录，做一个摘要"
      },
      ...messageList
    ],
  })
  return llmres.choices[0].message;
}

export async function summaryTitle(openai, messageList) {
  const llmres = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: "帮我总结下面的对话记录，生成一个小于16个字符的标题，一定要注意文字长度限制，不能超过16个字符"
      },
      ...messageList
    ],
  })
  return llmres.choices[0].message.content;
}

// 增加一个删除会话的方法
export function deleteConversation(userId, convertId) {
  const conversationObj = readConversation()
  delete conversationObj[userId][convertId]
  writeConversation(conversationObj)
}

export function readConversation() {
  const conversation = fs.readFileSync(path.resolve(__dirname, '../dbdata/conversation.json'), 'utf8');
  return JSON.parse(conversation);
}

export function writeConversation(obj) {
  const jsonStr = JSON.stringify(obj);
  fs.writeFileSync(path.resolve(__dirname, '../dbdata/conversation.json'), jsonStr);
}

export async function requestAI(opt) {
  const { openai, queryObj, userId, convertId, res, mcpResult } = opt
  const conversationObj = readConversation()
  const singleConvertList = conversationObj[userId][convertId].list
  if (singleConvertList.length > 10) {
    // 多截取一些，方便ai接口多给我们总结一下，每次大于10条只保留6条
    let removeNum = singleConvertList.length - 6
    if (singleConvertList[removeNum + 1].role === "tool") {
      removeNum += 1
    }
    const removeList = singleConvertList.splice(1, removeNum)
    const summaryRes = await summaryMessage(openai, removeList)
    singleConvertList.splice(1, 0, summaryRes)
  }
  // 每次回答，存到singleConvertList，保存上下文
  singleConvertList.push(queryObj)
  const ragContext = await createRAGContext(queryObj.content)
  const userMemo = await getUserMemoById(userId)
  const llmres = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: systemString
      },
      {
        role: "system",
        content: ragContext
      },
      {
        role: "system",
        content: userMemo || ""
      },
      ...singleConvertList
    ],
    // OpenAI SDK 规定字段名为 tools,不是 toolList
    tools: [
      ...mcpResult.toolList || [],
      ...toolList,
    ],
    stream: true
  })

  let resObj = {
    role: "assistant",
    id: "",
    content: ""
  }

  // 流式逐 chunk 推送
  // 注意：结尾 chunk 的 delta.content 可能为 undefined，需可选链保护
  //       且最后一个 chunk choices 可能为空数组，需可选链保护

  for await (let chunk of llmres) {
    const delta = chunk.choices[0]?.delta || {}
    resObj.id = chunk.id
    // 普通文本流式推送:只要 delta 有 content 就向前端推一帧
    if (delta?.content) {
      resObj.content += delta.content
      res.write(`data: ${JSON.stringify(resObj)} \n\n`)
    }
    // 流式 tool_calls 增量累积:每个 chunk 的 tool_calls 按 index 对位拼接
    if (delta?.tool_calls && delta.tool_calls.length > 0) {
      if (!resObj.tool_calls) {
        resObj.tool_calls = []
      }
      for (const chunkTool of delta.tool_calls) {
        const toolIndex = chunkTool.index
        if (!resObj.tool_calls[toolIndex]) {
          resObj.tool_calls[toolIndex] = {
            id: '',
            type: 'function',
            function: { name: '', arguments: '' }
          }
        }
        const targetTool = resObj.tool_calls[toolIndex]
        if (chunkTool.id) {
          targetTool.id = chunkTool.id
        }
        if (chunkTool.function?.name) {
          targetTool.function.name += chunkTool.function.name
        }
        if (chunkTool.function?.arguments) {
          targetTool.function.arguments += chunkTool.function.arguments
        }
      }
      res.write(`data: ${JSON.stringify(resObj)} \n\n`)
    }
  }

  // 入口清洗:过滤掉模型返回的非标准字段,保证存储的消息符合 OpenAI 规范
  // - reasoning_content:思维链字段,非 OpenAI 标准,API 不认
  // - tool_calls[].index:流式 chunk 拼接时的索引,非标准
  // - id(chatcmpl-xxx):chat completion 的 id,不属于 message 对象
  if (resObj.reasoning_content !== undefined) {
    delete resObj.reasoning_content
  }
  if (resObj.id !== undefined) {
    delete resObj.id
  }
  if (Array.isArray(resObj.tool_calls)) {
    for (const tc of resObj.tool_calls) {
      if (tc.index !== undefined) delete tc.index
    }
  }

  singleConvertList.push(resObj)
  writeConversation(conversationObj)

  if (resObj.tool_calls && resObj.tool_calls.length > 0) {
    const tool_calls = resObj.tool_calls
    const toolQueryObj = {
      role: "tool",
      content: "",
      id: "",
    }
    for (let toolIndex = 0; toolIndex < tool_calls.length; toolIndex++) {
      const singleTool = tool_calls[toolIndex]
      // OpenAI tool_calls 结构:name/arguments 在 singleTool.function 下
      const name = singleTool.function.name
      // 避免占用保留字 arguments
      const toolarguments = JSON.parse(singleTool.function.arguments || '{}')
      toolQueryObj.id = singleTool.id
      if (frontList.includes(name)) {
        // 按前端工具逻辑处理，不给ai回复，直接给前端下发消息
        const result = await toolHandleMap[name](toolarguments)
        toolQueryObj.content = "此消息无意义，纯粹让前端展示UI卡片"
        toolQueryObj.cardName = name
        toolQueryObj.arguments = {
          ...toolarguments,
          data: result,
        }
        singleConvertList.push(toolQueryObj)
        writeConversation(conversationObj)
        res.write(`data: ${JSON.stringify(toolQueryObj)} \n\n`)
        res.end()
      } else {
        let result = {}
        if (mcpResult.toolMap[name]) {
          // 第三方的mcp工具调用
          // 注意:client.callTool 返回 Promise,必须 await,否则 result 是 Promise
          // 后续 result.content 为 undefined,会导致发给 LLM 的 tool 消息缺 content 字段
          const servername = mcpResult.toolMap[name]
          const client = mcpResult.clientMap[servername].client
          result = await client.callTool({
            name: name,
            arguments: toolarguments
          })
        } else {
          result = await toolHandleMap[name](toolarguments)
        }
        // 兜底:确保 content 始终是字符串,避免下游 LLM 报 "Field required: input.contents"
        toolQueryObj.content = JSON.stringify(result.content ?? "")
        await requestAI({
          openai,
          queryObj: toolQueryObj,
          userId,
          convertId,
          res,
          mcpResult,
        })
      }
    }
  } else {
    res.write(`data: ${JSON.stringify({ done: true })} \n\n`) 
    res.end()
  }
}

export function readFileToText(filePath) {
  const result = fs.readFileSync(filePath, 'utf-8')
  return result.toString()
}

export async function readDocToText() {
  const docDir = path.resolve(__dirname, '../doc')
  const dirInfo = fs.readdirSync(docDir)
  const docArr = []
  for (let i = 0; i < dirInfo.length; i++) {
    const filePath = path.resolve(docDir, dirInfo[i])
    const text = readFileToText(filePath)
    docArr.push(text)
  }
  return docArr
}

export async function splitDoc(docText) {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 50, // 每个chunk的字符数，真实业务建议100-500
    chunkOverlap: 20, // 允许重叠字符数，有利于增加语义上下文完整性
    separators: ['\n\n', '\n', '.', '。', ',', '，', ' ', '但是'],
  })
  const chunks = await textSplitter.splitText(docText)
  return chunks
}

export async function searchByQuestion(qtext) {
  return await textSearch(qtext)
}

export async function createRAGContext(qtext) {
  const ragContext = fs.readFileSync(path.resolve(__dirname, '../context/ragContext.md'))
  const searchArr = await searchByQuestion(qtext)
  const searchText = searchArr.map((item) => {
    return item.metadata.text
  }).join('\n')
  let ragString =  ragContext.toString()
  ragString = ragString.replace('${text}', searchText)
  return ragString
}

export async function getUserMemoById(id) {
    const memoJsonStr = fs.readFileSync("./dbdata/userMemo.json")
    const jsonObj = JSON.parse(memoJsonStr)
    const useMemo = jsonObj[id];
    //做一个自定义转化，转化为字符串在给ai大模型
    let str = "以下是用户的一些特点，请牢记，回答的时候根据用户特点进行回答\n";
    const { sf, like, status } = useMemo
    if (sf) {
        //身份相关的特点写死逻辑，拼到str
        if (sf.career) {
            str += "我的职业是" + sf.career + "\n"
        }
        if (sf.location) {
            str += "我的居住地是" + sf.location + "\n"
        }
    }
    if (like) {
        //身份相关的特点写死逻辑，拼到str
        if (like.career) {
            str += "我喜欢的食物有" + like.food.join(",") + "\n"
        }
        if (like.sport) {
            str += "我喜欢的运动是" + like.sport.join(",") + "\n"
        }
    }
    if (status) {
        //身份相关的特点写死逻辑，拼到str
        if (status.feel) {
            str += "我的感情状态：" + status.feel + "\n"
        }
        if (status.body) {
            str += "我的身体状态" + status.body + "\n"
        }
    }
    return str;
}

export async function linkMcpAndListTool() {
  const clientMap = {}
  const toolMap = {}
  const toolList = []
  for (let i = 0; i < mcpList.length; i++) {
    const mcpServer = mcpList[i]
    const client = new Client({
      name: "mcp" + i,
      version: "1.0.0"
    })
    const transport = new StreamableHTTPClientTransport(mcpServer.url)
    await client.connect(transport)
    // 1. 用服务名字储存client
    clientMap[mcpServer.name] = {
      client,
      transport,
    }
    const mcpTools = await client.listTools()
    const openaiTypeList = transformToOpenAi(mcpTools)
    openaiTypeList.forEach((tool) => {
      // 记录每一个工具它对应的服务名字，到时候大模型说要调用哪个工具，用工具名就找到对应的服务
      toolMap[tool.function.name] = mcpServer.name
      toolList.push(tool)
    })
  }

  return {
    clientMap,
    toolMap,
    toolList,
  }
}

export function transformToOpenAi(result) {
  const tools = result.tools
  const openTools = tools.map((tool) => {
    const functionObj = {}
    functionObj.name = tool.name
    functionObj.description = tool.description
    functionObj.parameters = tool.inputSchema
    return {
      type: "function",
      function: functionObj
    }
  })
  return openTools
}

