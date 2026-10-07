import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { OpenAI } from 'openai'
import "dotenv/config"

// ESM 下 __dirname 不再自动注入,需手动构造
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function getUserLiker(conversationArr) {
  const openai = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  })
  const llmres = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: "分析下面的链条记录，找出用户的额喜好和状态，以及身份，以第一视角返回"
      },
      {
        role: "user",
        content: JSON.stringify(conversationArr)
      }
    ],
  })
  return llmres.choices[0].message
}
export async function getUserMemory(userId) {
  // 第一步，根据用户id找出用户最近的对话
  const jsonStr = fs.readFileSync(path.resolve(__dirname, "./dbdata/conversation.json"))
  const jsonObj = JSON.parse(jsonStr)
  const userConvertIdList = Object.keys(jsonObj[userId])
  const conversationArr = []
  for (let i = 0; i < userConvertIdList.length; i++) {
    const convertId = userConvertIdList[i]
    const conversation = jsonObj[userId][convertId]
    // 生产通常限定截取最近的30，50，100个会话
    conversationArr.push(conversation)
  }
  // 第二步，把记录给到ai，让ai给我们生成用户的喜好
  const result = await getUserLiker(conversationArr)

  // 第三步，根据用户喜好存入数据库
  const memoJsonStr = fs.readFileSync(path.resolve(__dirname, "./dbdata/userMemo.json"))
  const memoJsonObj = JSON.parse(memoJsonStr)
  memoJsonObj[userId] = result.content
  fs.writeFileSync(path.resolve(__dirname, "./dbdata/userMemo.json"), JSON.stringify(memoJsonObj))
}

getUserMemory("123")
