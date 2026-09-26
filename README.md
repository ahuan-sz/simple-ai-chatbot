# 简易 AI 前端助手

基于 Vue 3 + Vite 前端 与 Express + OpenAI SDK 后端的对话式 AI 助手，支持流式输出（打字机效果）与会话上下文管理。

## 技术栈

- **前端**：Vue 3 + Vite + Vue Router + `@microsoft/fetch-event-source`（SSE）+ axios
- **后端**：Express 5 + OpenAI SDK（兼容阿里云 DashScope 等 OpenAI 协议网关）+ 文件存储
- **模型**：通过 `OPENAI_BASE_URL` 指向的兼容端点调用（默认 qwen 系列）

## 目录结构

```
ai-chatbot/
├── client/               # 前端
│   ├── src/
│   │   ├── api/          # 接口封装（SSE + axios）
│   │   ├── components/   # Markdown 渲染组件
│   │   ├── router/       # 路由（默认带 userId=123）
│   │   ├── views/        # 页面（Home.vue 聊天主界面）
│   │   └── ...
│   └── vite.config.js
├── server/               # 后端
│   ├── index.js          # Express 入口，/llm 流式接口
│   ├── utils.js          # 会话读写、摘要、标题生成
│   ├── context.md        # system prompt
│   ├── conversation.json # 会话数据存储（文件）
│   └── .env              # 环境变量（需自行配置）
```

## 环境要求

- Node.js ≥ 18（使用了 ESM 与原生 fetch）
- npm 或 pnpm / yarn 均可

## 后端配置（server/.env）

在 `server/` 目录下新建 `.env` 文件，填入兼容 OpenAI 协议的网关地址与 API Key：

```env
OPENAI_BASE_URL=https://your-llm-gateway/compatible-mode/v1
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_MODEL=qwen3.8-max
```

> 注：模型名通过 `OPENAI_MODEL` 环境变量配置。如调用报 `Model not found`，请按你的网关实际支持的模型名替换（例如 `qwen-max`、`qwen-plus` 等）。

## 本地运行

### 1. 启动后端

```bash
cd server
npm install
npm start
```

后端默认监听 **http://localhost:3000**，提供以下接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/llm` | 流式聊天接口（SSE） |
| GET | `/conversation/create` | 新建会话 |
| GET | `/conversation/get` | 查询单个会话 |
| GET | `/conversation/list` | 列出用户所有会话 |
| GET | `/conversation/delete` | 删除指定会话 |

### 2. 启动前端

```bash
cd client
npm install
npm run dev
```

前端默认监听 **http://localhost:5173**。打开后访问根路径会自动带上 `userId=123` 跳转到 `/?userId=123`，随后自动创建一个新会话。

### 3. 使用

- 浏览器访问 `http://localhost:5173/`
- 在输入框输入内容，点击「发送」即可与 AI 对话，回答以打字机效果逐字展示
- 点击「新建会话」可开启新的对话上下文

## 备注

- 前端硬编码后端地址为 `http://localhost:3000`（见 `client/src/api/index.js`），如需部署请改为实际地址
- 会话数据存储在 `server/conversation.json`，删除/重启服务不会丢失
- `userId` 通过 URL query 传递，默认 `123`，可通过 `/?userId=xxx` 切换不同用户上下文
