# Ticket Record

个人使用的、简化版私人 Jira 看板。核心概念、设计取舍见 [`SPEC.md`](./SPEC.md)、[`CONTEXT.md`](./CONTEXT.md)（领域术语）和 [`docs/adr/`](./docs/adr/)（关键技术决策）。

## 技术栈

- [Next.js](https://nextjs.org) App Router + TypeScript，部署在 Vercel
- [Neon](https://neon.tech) Postgres（Serverless），通过 [Drizzle ORM](https://orm.drizzle.team) 访问
- [Auth.js](https://authjs.dev)（v5），Credentials 登录（邮箱 + 密码），JWT session
- Tailwind CSS，[`@dnd-kit`](https://dndkit.com) 做看板拖拽

## Agent 接入

在 Ticket 详情点击 **Give to Agent** 生成该 Ticket 的访问 Token，按面板配置共享的 `/api/mcp` 连接。切换 Ticket 时替换 `TICKET_RECORD_TOKEN` 并重新加载客户端配置。

工具包括 `get_current_ticket()`（读取含标签、进展的 DTO）、`update_current_ticket({ changes })`（修改字段）、`update_ticket_item({ updateId, body, details? })`（修改该任务的进展）和 `add_ticket_update({ body, agentName?, requestId? })`（向右侧进展区追加记录）。可选的 UUID 用于避免重复记录。

新增数据库字段使用 `npm run db:push` 同步到开发数据库。

## 本地开发

### 1. 装依赖

```bash
npm install
```

### 2. 建一个 Neon 数据库

1. 去 [neon.tech](https://neon.tech) 注册（免费档够用），创建一个 Project
2. 在 Dashboard → Connect 里复制 **Pooled connection** 字符串
3. 去 `Auth.js` 生成一个 session secret：

   ```bash
   npx auth secret
   ```

### 3. 配置环境变量

复制 `.env.local.example` 为 `.env.local`，填入数据库连接串和登录密钥：

```bash
cp .env.local.example .env.local
```

```ini
DATABASE_URL=postgresql://...你的 Neon 开发分支的 pooled 连接串...
DATABASE_URL_UNPOOLED=postgresql://...同一开发分支的 direct 连接串...
AUTH_SECRET=...刚生成的值...
```

### 4. 建表

```bash
npm run db:push
```

（`db:push` 直接把 `src/db/schema.ts` 同步到数据库，本地/个人项目最省事。以后要走规范迁移流程时用 `db:generate` + `db:migrate`。）

### 5. 启动

```bash
npm run dev
```

打开 <http://localhost:3000>，登录或注册账号，开始建 Board。应用使用 Neon 开发数据库。Drizzle 优先使用 `DATABASE_URL_UNPOOLED` 执行结构同步和迁移。

## 常用脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发服务器 |
| `npm run build` / `npm run start` | 生产构建 / 启动 |
| `npm run lint` | ESLint |
| `npm run db:push` | 把 schema 直接同步到数据库（开发用） |
| `npm run db:generate` | 根据 schema 变化生成 SQL 迁移文件 |
| `npm run db:migrate` | 执行迁移文件 |
| `npm run db:studio` | 打开 Drizzle Studio 看数据 |

## 部署到 Vercel

1. 把仓库推到 GitHub，在 Vercel 里 import（之后每次 push 自动部署，无需在仓库里配任何密钥）
2. Vercel Project → Settings → Environment Variables，添加 `DATABASE_URL`、`AUTH_SECRET`，并标记为 **Sensitive**（创建后不可再读取，只在构建/运行时注入）
3. 可选：用 [Neon 的 Vercel 集成](https://neon.tech/docs/guides/vercel) 自动注入 `DATABASE_URL`，还能给每个 Preview Deployment 建独立数据库分支
4. 首次部署前（或 schema 变更后）对生产库跑一次 `npm run db:push`（或 `db:generate` + `db:migrate` 走正式迁移）

### 凭据隔离原则

- **生产凭据只存在 Vercel**，永远不落到本机文件
- 本机 `.env.local` 只放**开发专用**凭据：建议在 Neon 建一个 dev 分支（Branches → New Branch），用它的连接串；`AUTH_SECRET` 也用开发专用的
- 不想把变量写进文件时，可以用 Vercel CLI：`vercel link` 后 `vercel env run -- npm run dev`（变量只注入该命令进程）；或 `vercel env pull .env.local`
- `.gitignore` 已排除 `.env*` 和 `.vercel/`；再配合 `.cursorignore`（见下）降低凭据进入 AI 上下文的概率——注意这是 best-effort，不是绝对边界

```gitignore
# .cursorignore（手动创建在仓库根目录）
.env
.env.*
.vercel/
!.env.local.example
```

## 目录速览

- `src/db/schema.ts` — 数据模型（Drizzle）
- `src/lib/data.ts` — 只读查询
- `src/lib/actions/*` — 所有写操作（Server Actions），每个都会校验 Board 归属
- `src/app/(app)/boards` — Board 列表/创建/改名改 Key
- `src/app/(app)/b/[key]` — 看板 + 列表视图、Ticket 详情
- `src/auth.ts` / `src/auth.config.ts` / `src/proxy.ts` — 登录与路由保护
