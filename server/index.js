import express from "express"
import { OpenAI } from "openai"
import cors from "cors"
import { readConversation, writeConversation, summaryTitle, requestAI } from "./utils/utils.js"
import "dotenv/config"

const app = express()
app.use(cors())
app.use(express.json())

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

  // 必须 await,否则 Express 认为请求已结束,后续 res.write 推不动数据
  try {
    const { keyword, userId, convertId } = req.body
    const queryObj = {
      role: "user",
      content: keyword
    }
    await requestAI({
      openai,
      userId,
      convertId,
      queryObj,
      res,
    })
  } catch (err) {
    console.error("[/llm] error:", err)
    // 异常也走 SSE 推给前端,避免响应体不完整
    res.write(`data: ${JSON.stringify({ error: err?.message || String(err) })} \n\n`)
  } finally {
    // 关键:无论成功失败,必须正常结束 chunked 流
    if (!res.writableEnded) res.end()
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
