import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { OpenAI } from 'openai'
import dotenv from 'dotenv'

// ESM 下 __dirname 不再自动注入,需手动构造
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 显式指定 .env 路径
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

// 读取清理后的 conversation.json
const raw = fs.readFileSync(path.resolve(__dirname, '../dbdata/conversation.json'), 'utf8')
const obj = JSON.parse(raw)
const userId = Object.keys(obj)[0]
const convertId = Object.keys(obj[userId])[0]
let messageList = obj[userId][convertId].list

console.log('=== 原始消息列表 ===')
messageList.forEach((m, i) => {
  console.log(`[${i}] role=${m.role}, content长度=${m.content?.length || 0}, hasToolCalls=${!!m.tool_calls}`)
})

// 测试1: 原始数据
console.log('\n=== 测试1: 原始数据调用 summaryTitle ===')
try {
  const res = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages: [
      { role: "system", content: "生成标题" },
      ...messageList
    ],
  })
  console.log('✅ 成功:', res.choices[0].message.content)
} catch (e) {
  console.error('❌ 失败:', e.message)
}

// 测试2: 去掉 tool_calls
console.log('\n=== 测试2: 去掉 tool_calls 后调用 ===')
const cleanList = messageList.map(m => {
  if (m.tool_calls) {
    const { tool_calls, ...rest } = m
    return rest
  }
  return m
})
try {
  const res = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages: [
      { role: "system", content: "生成标题" },
      ...cleanList
    ],
  })
  console.log('✅ 成功:', res.choices[0].message.content)
} catch (e) {
  console.error('❌ 失败:', e.message)
}
