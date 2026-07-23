# 技术栈：Next.js (Vercel) + Auth.js + Neon Postgres

个人项目要求「云端可用、尽量便宜、部署在 Vercel」。对比过 Supabase 全家桶（Auth 与 DB 绑定，Free 版项目 7 天无活动会自动暂停）后，选择把认证和数据库拆开：认证用 Auth.js（与 Next.js/Vercel 整合最成熟，用户表存在自己的数据库里，不被单一认证供应商锁死），数据库用 Neon（Serverless Postgres，免费档够个人用量、没有整项目休眠的问题，是 Vercel 生态里常见的组合）。

代价是密码校验、会话等需要自己实现（不用 Supabase 现成的 Auth UI/SDK）；换来的是认证与数据库解耦、迁移成本低、长期费用可控。
