# Ticket Record

个人使用的、简化版私人 Jira 看板。核心概念、设计取舍见 [`SPEC.md`](./SPEC.md)、[`CONTEXT.md`](./CONTEXT.md)（领域术语）和 [`docs/adr/`](./docs/adr/)（关键技术决策）。

## 技术栈

- [Next.js](https://nextjs.org) App Router + TypeScript，部署在 Vercel
- [Neon](https://neon.tech) Postgres（Serverless），通过 [Drizzle ORM](https://orm.drizzle.team) 访问
- [Auth.js](https://authjs.dev)（v5），Credentials 登录（邮箱 + 密码），JWT session
- Tailwind CSS，[`@dnd-kit`](https://dndkit.com) 做看板拖拽

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

复制 `.env.local.example` 为 `.env.local`，填入上一步拿到的两个值：

```bash
cp .env.local.example .env.local
```

```ini
DATABASE_URL=postgresql://...你的 Neon 连接串...
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

打开 <http://localhost:3000>，注册一个账号，开始建 Board。

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

1. 把仓库推到 GitHub/GitLab，在 Vercel 里 import
2. 在 Vercel 项目的 Environment Variables 里配置 `DATABASE_URL`、`AUTH_SECRET`（和本地 `.env.local` 一样，生产建议用单独的 Neon 分支/项目）
3. 首次部署前（或 schema 变更后）在本地对生产库跑一次 `npm run db:push`（或用 `db:generate` + `db:migrate` 走正式迁移）

## 目录速览

- `src/db/schema.ts` — 数据模型（Drizzle）
- `src/lib/data.ts` — 只读查询
- `src/lib/actions/*` — 所有写操作（Server Actions），每个都会校验 Board 归属
- `src/app/(app)/boards` — Board 列表/创建/改名改 Key
- `src/app/(app)/b/[key]` — 看板 + 列表视图、Ticket 详情
- `src/auth.ts` / `src/auth.config.ts` / `src/middleware.ts` — 登录与路由保护
