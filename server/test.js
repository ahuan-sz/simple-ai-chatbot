import OpenAI from 'openai'
// import fs from 'fs'
import "dotenv/config"
import { add, get, search } from "./vector/store.js"

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
})

const arr = [
  "张三今年20岁",
  "张三是性别男",
  "张三是一个中国学生",
  "李四今年40岁",
  "李四是一个老师",
  "李四是一个中国老师",
]

const result = await openai.embeddings.create({
  model: process.env.OPENAI_EMBEDDING_MODEL,
  input: arr,
})

// fs.writeFileSync("./test.json", JSON.stringify(result))
const resultData = result.data
for (let i = 0; i < resultData.length; i++) {
  await add(String(i), resultData[i].embedding, arr[i])
}

// const item = await get("0")
// console.log(item)

// 用户提问，介绍一下张三

// 检索，不能直接拿文本进行检索，也是先要把问题转化为向量，而和资料转化的维度一致
const question = "介绍一下李四"
const questionResult = await openai.embeddings.create({
  model: process.env.OPENAI_EMBEDDING_MODEL,
  input: [question],
})
const questionVector = questionResult.data[0].embedding
const searchResult = await search(questionVector)
console.log('xxxxxxx', searchResult)
