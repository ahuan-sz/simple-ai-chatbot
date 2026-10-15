import {
  OpenAI
} from "openai"
import "dotenv/config"

const openai = new OpenAI({
  baseURL: "https://llm-5p2602dg3q13bu0e.cn-beijing.maas.aliyuncs.com/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
})

const res = await openai.request({
  method: "post",
  path: "/services/aigc/multimodal-generation/generation",
  body: {
    "model": "qwen-image-3.0",
    "input": {
      "messages": [{
        "role": "user",
        "content": [{
          "text": "画一个日本动漫卡通风格的穿着蓝色西装的年轻侦探"
        }]
      }]
    },
  }
})
console.log(JSON.stringify(res.output))
