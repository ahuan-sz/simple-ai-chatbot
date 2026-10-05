import OpenAI from 'openai'
import { add, get, search } from "./store.js"
import "dotenv/config"

export async function createVector(text) {
  const openai =  new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  })
  const response = await openai.embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL,
    input: text,
  })
  return response.data[0].embedding
}

export async function storeIn(text) {
  const vector = await createVector(text)
  await add(text, vector, text)
}

export async function textSearch(text) {
  const textVector = await createVector(text)
  const searchResult = await search(textVector)
  return searchResult
}
