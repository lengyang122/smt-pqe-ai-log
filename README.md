# SMT PQE AI工作日志助手

面向SMT车间现场PQE工程师的在线工作日志工具。技术栈为 Next.js 14、TypeScript、Tailwind CSS、Supabase 与 DeepSeek API。项目默认单用户模式，暂不包含登录。

## 已实现功能

- 一句话生成工作内容和工作感想（调用 DeepSeek，服务端生成）
- AI 生成内容自动校验字数：工作内容 70-80 字、工作感想 40-50 字，不达标自动重新生成（最多 3 次）
- AOI、SPI、供应商、QMS、控制计划等快捷输入
- 工作内容与工作感想字数统计
- Supabase 云端永久保存、查询、删除历史日志
- Supabase 未配置时自动回退到浏览器 localStorage，方便本地开发
- 关键词搜索、查看历史、一键复制

## DeepSeek API 配置教程

1. **注册 DeepSeek 开放平台**：打开 https://platform.deepseek.com ，注册账号并完成登录。
2. **创建 API Key**：进入「API Keys」页面，点击「创建 API Key」，复制生成的密钥（`sk-...`）。
3. **添加 Vercel 环境变量**：在 Vercel 项目 Settings → Environment Variables 中添加：
   - `DEEPSEEK_API_KEY`：填上一步复制的密钥
   - （可选）`SUPABASE_URL`、`SUPABASE_ANON_KEY`：Supabase 配置见下文
4. **重新部署**：修改环境变量后，在 Vercel 的 Deployments 页面点击右上角 `...` → Redeploy，让新环境变量生效。

## 环境变量

复制 `.env.example` 为 `.env.local`：

```env
DEEPSEEK_API_KEY=your_api_key_here
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

生产环境中只在 Vercel 环境变量中填写真实值，不要把 `.env.local` 提交到 GitHub。

## 本地运行

```bash
npm install
copy .env.example .env.local
# 在 .env.local 中填入 DEEPSEEK_API_KEY
npm run dev
```

打开 http://localhost:3000。生产构建：

```bash
npm run build
npm start
```

## AI 生成接口说明

`POST /api/generate`，请求体：

```json
{ "input": "AOI发现焊接不良，协助分析原因" }
```

服务端调用 DeepSeek（模型 `deepseek-chat`，Base URL `https://api.deepseek.com`），返回：

```json
{
  "workContent": "……（70-80字）",
  "reflection": "……（40-50字）"
}
```

生成后自动统计字数，不达标会重新调用 DeepSeek 修正，最多重新生成 3 次。

## Supabase 配置

1. 打开 https://supabase.com/dashboard，创建新项目。
2. 进入左侧 SQL Editor，新建查询。
3. 复制并执行项目中的 `supabase/schema.sql`。
4. 进入 Project Settings → API，复制 Project URL 和 anon public key。
5. 将它们分别填入 `SUPABASE_URL`、`SUPABASE_ANON_KEY`。

当前为默认单用户模式，SQL 中的 RLS 策略允许匿名读、写、删。如果未来增加登录，应改为按用户 ID 隔离数据，并收紧策略。

## GitHub 上传

在项目目录执行：

```bash
git init
git add .
git commit -m "feat: add SMT PQE AI work log app"
git branch -M main
git remote add origin https://github.com/你的用户名/smt-pqe-ai-log.git
git push -u origin main
```

建议在 GitHub 仓库中确认没有提交 `.env.local`、API Key 或 Supabase 私密密钥。

## Vercel 部署

1. 打开 https://vercel.com 并使用 GitHub 登录。
2. 点击 Add New → Project，导入 `smt-pqe-ai-log` 仓库。
3. Framework Preset 选择 Next.js，Build Command 保持 `npm run build`。
4. 在 Environment Variables 添加 `DEEPSEEK_API_KEY`、`SUPABASE_URL`、`SUPABASE_ANON_KEY`。
5. 点击 Deploy。部署完成后，Vercel 会分配一个 `*.vercel.app` 公网网址。
6. 修改环境变量后，需要在 Deployments 中重新 Redeploy 才会应用到新部署。

## 绑定自己的域名

1. 在 Vercel 项目中进入 Settings → Domains。
2. 输入自己的域名并点击 Add。
3. 按 Vercel 显示的记录，在域名服务商后台添加 DNS：通常根域名使用 A 记录，`www` 使用 CNAME。
4. 等待 DNS 生效，Vercel 验证通过后会自动配置 HTTPS。

## API 路由

- `POST /api/generate`：调用 DeepSeek 生成日志（返回 `workContent` / `reflection`）
- `GET /api/logs`：查询 Supabase 历史日志
- `POST /api/logs`：保存日志
- `DELETE /api/logs/[id]`：删除日志

## 部署前检查

```bash
npm install
npm run build
```

当前项目已通过 `npm run build` 生产构建检查。
