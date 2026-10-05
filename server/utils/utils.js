import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"

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
        content: "帮我总结下面的对话记录，生成一个小于16个字符的标题"
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
  const { openai, queryObj, userId, convertId, res } = opt
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
      ...singleConvertList
    ],
    // OpenAI SDK 规定字段名为 tools,不是 toolList
    tools: toolList,
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

  singleConvertList.push(resObj)
  writeConversation(conversationObj)

  if (resObj.tool_calls && resObj.tool_calls.length > 0) {
    const tool_calls = resObj.tool_calls
    for (let toolIndex = 0; toolIndex < tool_calls.length; toolIndex++) {
      const singleTool = tool_calls[toolIndex]
      // OpenAI tool_calls 结构:name/arguments 在 singleTool.function 下
      const name = singleTool.function.name
      // 避免占用保留字 arguments
      const args = JSON.parse(singleTool.function.arguments || '{}')
      if (frontList.includes(name)) {
        // 按前端工具逻辑处理，不给ai回复，直接给前端下发消息
        const result = await toolHandleMap[name](args)
        const obj = {
          id: singleTool.id,
          role: "tool",
          content: "此消息无意义，纯粹让前端展示UI卡片",
          cardName: name,
          arguments: {
            ...args,
            data: result,
          },
        }
        singleConvertList.push(obj)
        writeConversation(conversationObj)
        res.write(`data: ${JSON.stringify(obj)} \n\n`)
        res.end()
      } else {
        const result = await toolHandleMap[name](args)
        const toolQueryObj = {
          role: "tool",
          content: result,
          id: singleTool.id,
        }
        await requestAI({
          openai,
          queryObj: toolQueryObj,
          userId,
          convertId,
          res,
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
