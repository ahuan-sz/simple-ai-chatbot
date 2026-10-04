// 本地做文本转向量
import { pipeline, env } from "@xenova/transformers"
import fs from 'fs'

// 下载大模型
// xenova/bert-base-uncased-768维 xenova/all-MiniLM-L6-v2-384维
// env设置远程下载地址为国内镜像 hf-mirror.com
env.remoteHost = "https://hf-mirror.com"
// 注意:模型名必须用小写, xenoa 仓库名是 all-MiniLM-L6-v2, 384 只是维度不是命名的一部分
const extractor = await pipeline("feature-extraction", "xenova/all-MiniLM-L6-v2")

const arr = [
  "张三今年20岁",
  "张三是一个学生",
  "张三是一个中国学生",
  "李四今年40岁",
  "李四是一个老师",
  "李四是一个中国老师",
]

// 用来转向量的方法
const result = await extractor(arr)
const resultArr = Array.from(result)
// fs.writeFileSync("./test2.json", JSON.stringify(resultArr))

