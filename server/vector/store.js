import { VectorDB } from "ruvector"

const db = new VectorDB({
  dimension: 1024,
  path: "./data/vectorData.db", // 数据按文件存储到这，没有则是内存存储
  metric: "Cosine", // 查找算法 Cosine、Euclidean、DotProduct
})

export async function add(id, vector, originText) {
  // upsert 语义:先删后插,避免重复运行导致同一 id 累积多条记录
  await db.delete(id)
  await db.insert({
    id,
    vector,
    metadata: {
      text: originText
    }
  })
}

export async function get(id) {
  return await db.get(id)
}

export async function search(searchVector) {
  const searchArr = await db.search({
    vector: searchVector,
    k: 5,
  })
  return searchArr.map((item) => {
    return {
      id: item.id,
      score: item.score,
      text: item.metadata,
    }
  })
}
