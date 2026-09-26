import fs from "fs"

export async function summaryMessage(openai, messageList) {
  const llmres = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: "帮我总结下面的对话记录，做一个摘要"
      },
      ...messageList
    ],
  })
  return llmres.choices[0].message;
}

export async function summaryTitle(openai, messageList) {
  const llmres = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: "帮我总结下面的对话记录，生成一个小于16个字符的标题"
      },
      ...messageList
    ],
  })
  return llmres.choices[0].message.content;
}

// 增加一个删除会话的方法
export function deleteConversation(userId, convertId) {
  const conversationObj = readConversation()
  delete conversationObj[userId][convertId]
  writeConversation(conversationObj)
}

export function readConversation() {
  const conversation = fs.readFileSync('./conversation.json', 'utf8');
  return JSON.parse(conversation);
}

export function writeConversation(obj) {
  const jsonStr = JSON.stringify(obj);
  fs.writeFileSync('./conversation.json', jsonStr);
}
