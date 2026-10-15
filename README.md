<div align="center">

# AI Workflow

**剧本 → 角色 → 分镜 → 视频 → 合并 → 发布的 AI 视频创作工作台**

**AI-Powered Video Creation Pipeline — analyze scripts, generate characters, scenes, clips and merge them into finished videos.**

[![Next.js](https://img.shields.io/badge/Next.js-16.x-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![React Flow](https://img.shields.io/badge/React%20Flow-canvas-FF4155?style=flat-square)](https://reactflow.dev/)
[![DeepSeek](https://img.shields.io/badge/LLM-DeepSeek-4D6BFE?style=flat-square)](https://www.deepseek.com/)
[![License](https://img.shields.io/badge/License-GPL--3.0-green?style=flat-square)](LICENSE)

**Live Demo / 在线体验**: 部署后访问你自己的域名即可（见下方部署章节）

</div>

---

## 是什么 / What is this

AI Workflow 是一个开箱即用的 **AI 视频创作全流程工作台**：把一段剧本（或直接粘贴视频分析结果）变成**角色设定 → 分镜画面 → 视频片段 → 合成成品**的完整流水线，全部在浏览器里完成。

- **提示词模式（Prompt Mode）**：剧本由 DeepSeek 等 LLM 生成角色提示词、分镜提示词、视频提示词，节点即卡片——提示词直接可见、可复制、可内联编辑。
- **双视图**：创作台（Chat，逐环节 AI 对话式生成）+ 流程画布（Canvas，可视化节点编排），一键切换。
- **多模型聚合**：视频（Seedance / Hailuo / Wan / Sora 2 Pro）、图片（Gemini / Seedream / Wan）统一在一个界面内切换调用。
- **后台任务**：生成任务可列表管理、启停、断点续跑，失败自动重试；合并、打包、下载一站式完成。

## ✨ Features

| 能力 | 说明 |
| --- | --- |
| 🎬 视频理解 | 上传视频 → AI 分析出角色与分镜脚本，直接进入生产流程 |
| 🧑🎨 角色生成 | 从剧本抽取角色 → 生成角色提示词 → 多模型出角色参考图 |
| 🖼️ 分镜画面 | 角色参考 + 分镜描述 → 图生图精确生成分镜帧 |
| 🎥 视频片段 | 分镜帧 + 提示词 → 多模型文生/图生视频（支持首帧/尾帧衔接） |
| ✂️ 智能合并 | 多段视频自动合并成片，支持批处理与进度跟踪 |
| ⚙️ 流程画布 | React Flow 节点编排：角色/分镜/视频/输出节点卡片化，间距清晰可读 |
| 💬 创作台 | 与 AI 对话式逐环节推进：精炼剧本、细化分镜、生成提示词 |
| 🔑 可选登录保护 | 环境变量一键启用账号口令登录，一年免登录，可对接统一 SSO |
| 📦 资产管理 | 生成结果（图片/视频/脚本/清单）可视化预览、下载、打包 ZIP |
| ☁️ 可选存储 | 阿里云 OSS 上传、Supabase 历史记录（按需配置） |

## 🎬 Workflow

```
 ┌──────────┐   ┌──────────┐   ┌────────────┐   ┌────────────┐   ┌──────────┐   ┌──────────┐
 │  Input   │──▶│ Analyze  │──▶│ Characters │──▶│   Scenes   │──▶│  Videos  │──▶│  Merge   │
 │  Video / │   │  Script  │   │  Prompts + │   │  Frames +  │   │  Clips + │   │  Output  │
 │  Script  │   │          │   │  Reference │   │  Prompts   │   │  Prompts │   │  Video   │
 └──────────┘   └──────────┘   └────────────┘   └────────────┘   └──────────┘   └──────────┘
```

每条产线可独立推进，支持并行生成（图片 3 并发 / 视频 2 并发）、失败重试与断点续跑。

## 🚀 快速开始 / Quick Start

环境要求：Node.js ≥ 20（推荐 22）。

```bash
git clone https://github.com/lovehaichina/ai-workflow.git
cd ai-workflow
npm install

# 准备环境变量（可选，默认无需配置即可运行）
cp .env.example .env.local

# 开发模式
npm run dev
# 打开 http://localhost:3000
```

> 未配置任何环境变量也可直接体验：LLM 默认走 DeepSeek 的 OpenAI 兼容接口，模型地址/模型名可通过环境变量覆盖；图片/视频模型走聚合网关，在界面设置里填入你的 API Key 即可。

## ⚙️ 配置 / Configuration

所有配置均为**可选**，通过环境变量（`.env.local` 或 systemd `Environment=`）注入：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `LLM_BASE_URL` | `https://api.deepseek.com/v1` | LLM 接口（OpenAI 兼容） |
| `LLM_MODEL` | `deepseek-chat` | LLM 模型名 |
| `AIWF_ACCESS_USER` / `AIWF_ACCESS_PASS` | 空（不启用） | 启用登录保护：设置后全站需登录访问 |
| `OPENAI_API_KEY` | 空 | 界面默认 API Key（可留空，用户在界面填写） |
| `OSS_REGION` / `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET` / `OSS_BUCKET` | 空 | 阿里云 OSS 存储（可选） |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_TABLE_NAME` | 空 | 历史记录持久化（可选） |

## 🔐 登录保护 / Optional Login Protection

设置 `AIWF_ACCESS_USER` 与 `AIWF_ACCESS_PASS` 后自动启用：

- 未登录访问任意页面 → 跳转登录页（深蓝 + 琥珀风格，自适应手机/电脑）
- 登录成功下发 HttpOnly Cookie，**一年免登录**
- Cookie 协议与统一 SSO 网关兼容：登录一次可跨同主域多个子站（网关需自行搭建）
- 不设置这两个变量 → 跳过登录保护，便于本地开发与二次开发

## 🖥️ 生产部署 / Production Deployment

### 1. 构建 standalone

```bash
npm run build:prod   # 产出 .next/standalone（含 server.js）
```

### 2. systemd 服务（示例）

```ini
[Unit]
Description=AI Workflow
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/aiworkflow
ExecStart=/usr/bin/node /opt/aiworkflow/server.js
Environment=LLM_BASE_URL=https://api.deepseek.com/v1
Environment=LLM_MODEL=deepseek-chat
# Environment=AIWF_ACCESS_USER=your_user
# Environment=AIWF_ACCESS_PASS=your_password
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 3. Caddy 反代（自动 HTTPS）

```
ai.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
}
```

部署后访问 `https://ai.example.com` 即得完整工作台。

## 📁 项目结构 / Structure

```
src/
├── app/
│   ├── page.tsx              # 主界面：创作台 / 流程画布 双 Tab
│   ├── login/page.tsx        # 登录页（可选保护）
│   ├── image-gen/page.tsx    # 独立图片生成页
│   └── api/
│       ├── llm.ts            # LLM 统一封装（DeepSeek，可覆盖）
│       ├── workflow/*        # 流程：start/status/stop/continue/retry 等
│       ├── tasks/*           # 后台任务管理
│       └── chat/*            # 剧本/提示词精炼
├── components/workflow/      # 节点组件（CharacterNode/SceneNode/VideoNode 等）
├── config/api.ts             # 模型聚合配置（视频/图片/编辑）
├── constants/workflow.ts     # 画布布局与常量
├── hooks/                    # useWorkflow / useBackgroundWorkflow 等
└── lib/
    ├── auth.ts               # 可选登录认证（HMAC token）
    ├── clipboard.ts          # 剪贴板（含降级）
    └── supabase.ts           # 历史记录（可选）
```

## 🔧 二次开发 / Extending

- **新增视频模型**：在 `src/config/api.ts` 的 `VIDEO_MODELS` 中加一项即可（模型名、URL、默认参数、时长选项）。
- **新增图片模型**：同上在 `IMAGE_TEXT_TO_IMAGE_MODELS` / `IMAGE_EDIT_MODELS` 扩展。
- **调整画布布局**：改 `src/constants/workflow.ts` 的 `LAYOUT` / `SUB_SPACING_Y`。
- **替换 LLM**：任何 OpenAI 兼容服务只需设 `LLM_BASE_URL` / `LLM_MODEL`，无需改代码。
- **接自己的 SSO**：复用 `src/lib/auth.ts` 的 token 协议（HMAC-SHA256）即可与统一网关互通。

## 📄 License

本项目基于 **GPL-3.0** 协议开源，详情见 [LICENSE](LICENSE)。

## 🙏 致谢 / Credits

基于 [GPTProto/ai-workflow](https://github.com/GPTProto/ai-workflow) 深度改造：新增提示词模式、双视图、DeepSeek LLM 层、画布节点提示词卡片、可选登录保护与全站 SSO 适配。
