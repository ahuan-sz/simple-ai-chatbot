import { readDocToText, splitDoc, searchByQuestion, createRAGContext } from './utils.js'
import { storeIn } from './vector/index.js'

// const docArr = await readDocToText()
// for (const docText of docArr) {
//   const chunks = await splitDoc(docText)
//   for (let i = 0; i < chunks.length; i++) {
//     await storeIn(chunks[i])
//   }
// }

const arr = await createRAGContext('请假')
