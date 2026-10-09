import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { OpenAI } from 'openai'
import "dotenv/config"

// ESM 下 __dirname 不再自动注入,需手动构造
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function getUserConvertList(userId) {
    const jsonStr = fs.readFileSync(path.resolve(__dirname, "./dbdata/conversation.json"))
    const jsonObj = JSON.parse(jsonStr);
    const userConvertIdList = Object.keys(jsonObj[userId])
    const conversationArr = [];
    for (let i = 0; i < userConvertIdList.length; i++) {
        const _id = userConvertIdList[i];
        const convertList = jsonObj[userId][_id];
        //如果需要，可以限定截取最近50,100,30
        conversationArr.push(convertList)
    }
    return conversationArr;
}

export function storeIn(userId, type, result) {
  const memoJsonStr = fs.readFileSync(path.resolve(__dirname, "./dbdata/userMemo.json"))
  const memoJsonObj = JSON.parse(memoJsonStr)
  const memoInObj = memoJsonObj[userId]?.[type] || {}
  const resultContent = JSON.parse(result.content)
  // 如果本次生成没有提取到特点，应该不去替换
  for (let key in resultContent) {
    if (resultContent[key]) {
      memoInObj[key] = resultContent[key]
    } else {
      memoInObj[key] = ""
    }
  }
  if (memoJsonObj[userId]) {
    memoJsonObj[userId][type] = memoInObj
  } else {
    memoJsonObj[userId] = {}
    memoJsonObj[userId][type] = memoInObj
  }
  fs.writeFileSync(path.resolve(__dirname, "./dbdata/userMemo.json"), JSON.stringify(memoJsonObj))
}

/**
 * 调用 LLM 生成用户特点
 * @param {Array} conversationArr - 对话记录数组
 * @param {string} [contextContent] - 上下文内容,未传则使用 memoContext.md
 * @returns {Promise<object>} LLM 返回的 message 对象
 */
export async function getUserLiker(conversationArr, contextContent) {
  const openai = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  })
  // 未显式传入 context 时,回退到默认的 memoContext.md
  const memoContext = contextContent || fs.readFileSync(path.resolve(__dirname, "./context/memoContext.md"), "utf-8")
  const llmres = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: memoContext.toString()
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
  memoJsonObj[userId] = JSON.parse(result.content)
  fs.writeFileSync(path.resolve(__dirname, "./dbdata/userMemo.json"), JSON.stringify(memoJsonObj))
}

export async function createSf(userId) {
  // 第一步，根据id找出用户最近的对话
  const conversationArr = getUserConvertList(userId)
  // 这里建议做一个截取，因为对话记录太多了，根据特点要求，截取一部分，比如身份截取最急50条

  // 读取身份相关的生成上下文
  const sfMemo = fs.readFileSync(path.resolve(__dirname, "./context/sfContext.md"))
  // 第二步，把记录给到ai，让ai给我们生成用户的喜好
  const result = await getUserLiker(conversationArr, sfMemo.toString())
  // 第三步，根据用户喜好存入数据库
  storeIn(userId, 'sf', result)
}

export async function createLike(userId) {
  const conversationArr = getUserConvertList(userId)
  const likeMemo = fs.readFileSync(path.resolve(__dirname, "./context/likeContext.md"))
  const result = await getUserLiker(conversationArr, likeMemo.toString())
  storeIn(userId, 'like', result)
}

export async function createStatus(userId) {
  const conversationArr = getUserConvertList(userId)
  const statusMemo = fs.readFileSync(path.resolve(__dirname, "./context/statusContext.md"))
  const result = await getUserLiker(conversationArr, statusMemo.toString())
  storeIn(userId, 'status', result)
}

createSf("123")
createLike("123")
createStatus("123")
// getUserMemory("123")
