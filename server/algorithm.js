// 余弦相似度
export function cosineSimilarity(v1, v2) {
  const dotProduct = v1.reduce((acc, cur, index) => acc + cur * v2[index], 0)
  const norm1 = Math.sqrt(v1.reduce((acc, cur) => acc + cur * cur, 0))
  const norm2 = Math.sqrt(v2.reduce((acc, cur) => acc + cur * cur, 0))
  return dotProduct / (norm1 * norm2)
}

// 欧式距离
export function euclideanDistance(v1, v2) {
  const distance = Math.sqrt(v1.reduce((acc, cur, index) => acc + (cur - v2[index]) ** 2, 0))
  return distance
}

// 点积相似度
export function dotProductSimilarity(v1, v2) {
  const dotProduct = v1.reduce((acc, cur, index) => acc + cur * v2[index], 0)
  return dotProduct
}
