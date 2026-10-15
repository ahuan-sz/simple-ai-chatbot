# 简易 AI 前端助手

基于 Vue 3 + Ant Design Vue 前端 与 Express + OpenAI SDK 后端的对话式 AI 助手，支持流式输出（打字机效果）、MCP 工具调用、RAG 向量检索、用户记忆与会话上下文管理。

## ✨ 功能特性

- 🎨 **现代化 UI**：基于 Ant Design Vue 的聊天界面，支持消息气泡、Markdown 渲染、骨架屏思考动画
- 💬 **流式对话**：SSE (Server-Sent Events) 实现打字机效果逐字输出
- 🧩 **MCP 工具调用**：集成 Model Context Protocol，可调用外卖点餐、网页搜索、Chrome DevTools 等工具
- 📚 **RAG 向量检索**：基于 ruvector 的本地向量数据库，检索历史知识作为上下文
- 🧠 **用户记忆**：持久化存储用户特点（身份/喜好/状态），个性化回答
- 🖼️ **图片模式**：支持图片上传（base64）和图片生成两个独立路径
- 📝 **自动标题生成**：会话历史列表自动调用 AI 生成摘要标题
- 🔄 **优雅降级**：Embedding / 用户记忆服务不可用时自动降级，不阻塞主对话流程
- 🪟 **滑动窗口 + 上下文压缩**：超过 10 条历史消息时自动用 AI 摘要替换旧对话，保留最近 6 条原文，防止 token 溢出

## 🏗️ 技术栈

### 前端
- **Vue 3** + **Vite** + **Vue Router**
- **Ant Design Vue** (v4) + **@ant-design/icons-vue**
- **@crazydos/vue-markdown**（Markdown 渲染 + highlight.js 代码高亮）
- **@microsoft/fetch-event-source**（SSE 流式请求）
- **axios**（REST API）

### 后端
- **Express 5** + **OpenAI SDK**（兼容阿里云 DashScope / SillyTavern 等 OpenAI 协议网关）
- **Model Context Protocol SDK**（MCP 工具协议）
- **ruvector**（本地向量数据库，用于 RAG）
- **multer**（图片上传）
- **dotenv**（环境变量）

## 📂 目录结构

```
simple-ai-chatbot/
├── client/                        # 前端（Vue 3 + Ant Design Vue）
│   ├── src/
│   │   ├── api/index.js           # 接口封装（SSE + axios）
│   │   ├── components/
│   │   │   ├── MarkDown.vue       # Markdown 渲染组件
│   │   │   └── WmCard.vue         # 外卖点餐卡片组件
│   │   ├── router/index.js        # 路由（默认 userId=123）
│   │   ├── views/Home.vue         # 聊天主界面
│   │   ├── App.vue                # 全局布局（侧边栏 + 头部）
│   │   ├── main.js                # 入口
│   │   └── style.css              # 全局样式
│   ├── eslint.config.js           # ESLint flat config
│   └── vite.config.js
│
└── server/                        # 后端（Express 5 + MCP）
    ├── index.js                   # Express 入口，路由定义
    ├── utils/
    │   ├── utils.js               # 核心：requestAI / requestPicAI / RAG / 记忆 / 标题生成
    │   ├── tools.js               # MCP 工具处理函数
    │   └── algorithm.js           # 工具选择算法
    ├── vector/
    │   ├── index.js               # Embedding + 向量检索封装
    │   └── store.js               # ruvector 存储层
    ├── context/                   # System Prompt 模板
    │   ├── context.md             # 主系统提示词
    │   ├── ragContext.md          # RAG 上下文模板
    │   ├── memoContext.md         # 用户记忆模板
    │   ├── sfContext.md           # 用户身份模板
    │   ├── likeContext.md         # 用户喜好模板
    │   ├── statusContext.md       # 用户状态模板
    │   └── context2.md            # 备选提示词
    ├── dbdata/                    # 文件存储
    │   ├── conversation.json      # 会话历史
    │   ├── chunkList.json         # RAG 分块数据
    │   └── userMemo.json          # 用户记忆
    ├── data/                      # ruvector 数据库文件
    ├── config.js                  # MCP Server 列表配置
    ├── mcpClient.js               # MCP 客户端封装
    ├── agentMemory.js             # Agent 记忆模块
    ├── .env                       # 环境变量（需自行配置）
    └── package.json
```

## ⚙️ 环境要求

- **Node.js ≥ 18**（使用了 ESM、原生 fetch、顶层 await）
- **npm / pnpm / yarn** 任选
- 能访问兼容 OpenAI 协议的 AI 网关（阿里云 DashScope 等）

## 🔧 后端配置（server/.env）

在 `server/` 目录下新建 `.env` 文件：

```env
# Chat 模型网关（主对话）
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=qwen3.7-flash

# Embedding 模型（RAG 向量检索）
OPENAI_EMBEDDING_MODEL=text-embedding-v3

# 图片生成模型（独立网关，可选）
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_PIC_MODEL=wanx2.1-t2i-turbo

# MCP 服务地址（Web Search 工具等）
MCP_BASE_URL=https://your-mcp-gateway
```

> **注意**：如调用报 `Model not found`，请按你的网关实际支持的模型名替换。Embedding 模型额度耗尽不会阻塞主对话（自动降级）。

## 🚀 本地运行

### 1. 启动后端

```bash
cd server
npm install
npm start
```

后端默认监听 **http://localhost:3000**。

### 2. 启动前端

```bash
cd client
npm install
npm run dev
```

前端默认监听 **http://localhost:5173**（Vite 默认端口）。访问根路径会自动带上 `userId=123`。

### 3. 使用

- 浏览器访问 `http://localhost:5173/`
- **文本模式**：输入框输入内容 → Enter 发送 / Shift+Enter 换行 / 点击发送按钮
- **图片模式**：切换右上角分段控制器到"图片模式"，可上传图片生图
- **MCP 工具**：对话中 AI 会自动判断是否调用外卖点餐等工具，出现卡片后点击"点它"确认
- **新建会话**：点击侧边栏顶部 **+** 按钮或输入区清空按钮旁边的"新建会话"

## 📡 后端接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/llm` | 流式文本聊天（SSE），支持 MCP 工具调用 |
| POST | `/picllm` | 图片生成（非流式） |
| POST | `/upload` | 图片上传，返回 base64（multer） |
| GET | `/conversation/create` | 新建会话 |
| GET | `/conversation/get` | 查询单个会话详情 |
| GET | `/conversation/list` | 列出用户所有会话（自动 AI 生成标题） |

### `/llm` 请求体

```json
{
  "userId": "123",
  "convertId": "1231791517988982",
  "keyword": "帮我点一份外卖"
}
```

### `/upload` 请求

`multipart/form-data`，字段名 `image`，返回格式：

```json
{
  "success": true,
  "data": {
    "imageBase64": "data:image/png;base64,....",
    "originalName": "photo.png",
    "fileSize": 12345
  }
}
```

## 🧠 核心模块说明

### MCP 工具调用（server/config.js）

配置了 4 个 MCP Server：

| Server | 类型 | 用途 |
| --- | --- | --- |
| `myMcpServer1` | streamableHttp | 本地工具服务（端口 3001） |
| `myMcpServer2` | streamableHttp | 本地工具服务（端口 3002） |
| `web_search` | streamableHttp | 网页搜索（需配置 `MCP_BASE_URL`） |
| `chrome_dev_tools` | stdio | Chrome DevTools 自动化（npx chrome-devtools-mcp） |

> 外卖点餐等业务工具由本地 MCP Server 暴露。运行完整 MCP 链路需同时启动 `node mcpServer.js` 和 `node mcpServer2.js`（见 `npm run dev`）。

### RAG 向量检索（server/vector/）

流程：`user question → createVector → textSearch → ruvector 相似度搜索 → 拼接为 ragContext → 注入 system prompt`

依赖：`ruvector`（本地 SQLite 向量存储）、`OPENAI_EMBEDDING_MODEL`（Embedding 模型）。**Embedding 失败时自动降级，不阻塞 Chat**。

### 用户记忆（server/utils/utils.js）

`userMemo.json` 存储每个用户的 `{ sf: 身份, like: 喜好, status: 状态 }`，每次对话前注入 system prompt 实现个性化回答。**文件缺失 / userId 无数据时安全返回空字符串**。

### 滑动窗口 + 上下文压缩（server/utils/utils.js:94-104）

防止长对话 token 溢出的核心机制：

```
历史消息 > 10 条 ?
  ├─ 是 → 截取中间旧消息（保留最近 6 条）
  │       → 调用 AI 摘要（summaryMessage）
  │       → 摘要作为一条 role: "assistant" 消息插回列表头部
  │       → 跳过 tool 消息边界，避免截断 MCP 工具对话
  └─ 否 → 不压缩，直接使用
```

这样无论对话多长，发给 LLM 的 `messages` 数组始终控制在较小规模（1 条摘要 + 最近 6 条 + 当前 user query），同时保留完整语义信息。压缩使用主对话模型（`OPENAI_MODEL`），和普通对话共享额度。

## ⚠️ 备注

- 前端硬编码后端地址 `http://localhost:3000`（见 `client/src/api/index.js`），生产部署请改为实际地址或使用 Vite proxy
- 会话数据存储在 `server/dbdata/conversation.json`，重启不会丢失
- `data/vectorData.db` 是 ruvector 数据库，删除会清空 RAG 向量索引
- `userId` 通过 URL query 传递，默认 `123`，可通过 `/?userId=xxx` 切换用户上下文
- Chrome DevTools MCP 默认开启，会通过 npx 下载并启动 headless Chrome，**首次运行较慢**
- 如不需要 Chrome DevTools MCP，可注释掉 `config.js` 中的对应条目