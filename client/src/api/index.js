
import axios from 'axios';
import { fetchEventSource } from '@microsoft/fetch-event-source';
export function requestLLM(userId, convertId, keyword, callback) {
  return fetchEventSource('http://localhost:3000/llm', {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      auth: 'aaaaaa'
    },
    body: JSON.stringify({
      userId,
      convertId,
      keyword
    }),
    onmessage(event) {
      callback(event)
    }
  })
}

export function createConversation(userId) {
  return axios.get(`http://localhost:3000/conversation/create?userId=${userId}`)
}

export function getConversation(userId, convertId) {
  return axios.get(`http://localhost:3000/conversation/get?userId=${userId}&convertId=${convertId}`)
}

export function listConversation(userId) {
  return axios.get(`http://localhost:3000/conversation/list?userId=${userId}`)
}

export function deleteConversation(userId, convertId) {
  return axios.get(`http://localhost:3000/conversation/delete?userId=${userId}&convertId=${convertId}`)
}
