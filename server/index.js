import express from "express"
import { OpenAI } from "openai"
import cors from "cors"
import { readConversation, summaryMessage, writeConversation, summaryTitle } from "./utils.js"
import fs from "fs"
import "dotenv/config"

const app = express()
app.use(cors())
app.use(express.json())

const systemContext = fs.readFileSync("./context.md", "utf-8")
const systemString = systemContext.toString()

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

app.post("/llm", async (req, res) => {
  // 流式响应头先发出，状态码固定为 200
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  })

  // 包裹整个异步流程：任何异常都通过 SSE 推送错误信息，并保证 res.end() 一定被调用
  // 避免 ERR_INCOMPLETE_CHUNKED_ENCODING（chunked 流被半路掐断）
  try {
    const { keyword, userId, convertId } = req.body
    const conversationObj = readConversation()
    const singleConvertList = conversationObj[userId][convertId].list
    const queryObj = {
      role: "user",
      content: keyword
    }
    if (singleConvertList.length > 10) {
      // 多截取一些，方便ai接口多给我们总结一下，每次大于10条只保留6条
      const removeNum = singleConvertList.length - 6
      const removeList = singleConvertList.splice(1, removeNum)
      const summaryRes = await summaryMessage(openai, removeList)
      singleConvertList.splice(1, 0, summaryRes)
    }
    // 每次回答，存到singleConvertList，保存上下文
    singleConvertList.push(queryObj)

    const llmres = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: systemString
        },
        ...singleConvertList
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
      const delta = chunk.choices[0]?.delta
      resObj.id = chunk.id
      if (delta?.content) {
        resObj.content += delta.content
      }
      res.write(`data: ${JSON.stringify(resObj)} \n\n`)
    }

    singleConvertList.push(resObj)
    writeConversation(conversationObj)
    res.write(`data: ${JSON.stringify({ done: true })} \n\n`)
  } catch (err) {
    console.error("[/llm] error:", err)
    // 异常也通过 SSE 推给前端，保持响应体完整性
    res.write(`data: ${JSON.stringify({ error: err?.message || String(err) })} \n\n`)
  } finally {
    // 关键：无论成功失败，必须正常结束 chunked 流
    res.end()
  }
})

app.get("/conversation/create", (req, res) => {
  const userId = req.query.userId
  if (!userId) {
    res.json({
      success: false,
      message: "userId不能为空"
    })
    return
  }
  const conversationObj = readConversation()
  if (!conversationObj[userId]) {
    conversationObj[userId] = {}
  }
  const userConversationObj = conversationObj[userId]
  const convertId = userId + Date.now()
  userConversationObj[convertId] = {
    title: "",
    list: []
  }
  writeConversation(conversationObj)
  res.json({
    success: true,
    message: "创建成功",
    data: {
      convertId
    }
  })
})

app.get("/conversation/get", (req, res) => {
  const { userId, convertId } = req.query
  if (!userId || !convertId) {
    res.json({
      success: false,
      message: "userId或convertId不能为空"
    })
    return
  }
  const conversationObj = readConversation()
  const userAllConversationObj = conversationObj[userId]
  const targetConversation = userAllConversationObj[convertId]
  res.json({
    success: true,
    data: targetConversation,
    message: "查询成功"
  })
})

app.get("/conversation/list", async (req, res) => {
  const userId = req.query.userId
  const conversationObj = readConversation()
  const userAllConversationObj = conversationObj[userId]
  const convertIdList = Object.keys(userAllConversationObj)
  const returnList = []
  for (let i = 0; i < convertIdList.length; i++) {
    const convertId = convertIdList[i]
    const targetConversation = userAllConversationObj[convertId]
    if (targetConversation.title) {
      returnList.push({
        title: targetConversation.title,
        convertId
      })
    } else {
      if (targetConversation.list.length === 0) {
        returnList.push({
          title: "",
          convertId
        })
        writeConversation(conversationObj)
      } else {
        const aiTitle = await summaryTitle(openai, targetConversation.list)
        targetConversation.title = aiTitle
        returnList.push({
          title: aiTitle,
          convertId
        })
        writeConversation(conversationObj)
      }
    }
  }
  res.json({
    success: true,
    data: returnList,
    message: "查询成功"
  })
})

app.listen(3000, () => {
  console.log("Server is running on port 3000");
})
