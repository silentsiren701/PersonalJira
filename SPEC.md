# Ticket Record — 产品 Spec

> 本文档整理自设计访谈（grilling session），是当前实现的依据。领域术语见 [`CONTEXT.md`](./CONTEXT.md)，关键技术决策见 [`docs/adr/`](./docs/adr/)。

## Problem Statement

当前团队不使用 Jira/Agile 类工具，但个人仍需要一种方式追踪自己在不同场景（个人生活、公司工作，未来可能是朋友各自的场景）下的任务进度。现成的团队协作工具太重、不匹配单人使用习惯，也没有必要为一个人的追踪需求负担团队工具的复杂度和费用。

## Solution

构建一个简化版、私人使用的类 Jira 看板 Web 应用：

- 以 **Board** 划分使用场景（个人 / 公司 / 未来其他），登录后可在多个 Board 间切换
- Board 内自由创建 **Tag** 做分类，含义由使用者自定
- 创建 **Ticket** 记录任务：标题 + Markdown 简介，可挂多个 Tag，可选便签色
- Ticket 在四个固定状态间流转：`未开始` → `进行中` → `Blocked` → `关闭`（可来回移动）
- 默认 **看板** 视图（四列，可拖拽改状态/排序），「关闭」列仅显示近 7 天内关闭的 Ticket；切换到 **列表** 视图可搜索/筛选全部历史 Ticket
- 视觉隐喻是「便签纸」：无优先级字段，用手动拖拽排序代替；无评论、无附件、无自定义工作流

部署在 Vercel，数据库用 Neon Postgres，认证用 Auth.js（邮箱 + 密码起步）。以账户为单位私有；为未来「朋友各自拥有 Board」预留数据模型空间，但不做跨账户协作。

## User Stories

1. As a solo user, I want to register with email + password, so that I can access my own private boards.
2. As a returning user, I want to log in with email + password, so that I can resume tracking my tickets.
3. As a logged-in user, I want to log out, so that I can secure my account on a shared device.
4. As a user, I want to create a new Board with a name and a short Key (up to 4 uppercase letters), so that I can start tracking tasks for a new scenario.
5. As a user, I want to see a switcher listing all my Boards, so that I can jump between scenarios quickly.
6. As a user, I want to switch the active Board, so that I only see tickets relevant to the current context.
7. As a user, I want to rename a Board or change its Key, so that I can fix a typo or reflect a renamed scenario.
8. As a user, I want each Board's ticket numbering to start independently at 1, so that ticket numbers stay small and meaningful per scenario.
9. As a user, I want to create Tags scoped to the current Board, so that my classification vocabulary doesn't leak across unrelated scenarios.
10. As a user, I want to assign multiple Tags to a Ticket, so that I can classify it along more than one dimension.
11. As a user, I want to remove a Tag from a Ticket without deleting the Tag itself, so that I can correct a misclassification.
12. As a user, I want to delete a Tag from a Board, so that unused Tags don't clutter the filter list (existing tickets simply lose that tag).
13. As a user, I want to create a new Ticket with just a title, so that I can quickly capture a task before filling in details.
14. As a user, I want to write a Markdown description on a Ticket, so that I can record context, links, and formatted notes.
15. As a user, I want every new Ticket to default to `未开始`, so that new work starts in a predictable place.
16. As a user, I want to move a Ticket between the four fixed statuses, so that I can reflect its real progress.
17. As a user, I want to drag a Ticket card between Kanban columns to change its status, so that updating progress feels immediate and tactile.
18. As a user, I want to drag a Ticket card within a column to reorder it, so that the order reflects my own priority without a separate priority field.
19. As a user, I want to pick a sticky-note color for a Ticket from a fixed palette, so that I can visually group or highlight tickets the way real colored notes work.
20. As a user, I want the Kanban's `关闭` column to only show tickets closed within the last 7 days, so that the board stays visually uncluttered by old finished work.
21. As a user, I want to switch to a List view, so that I can see and search the full history of all tickets regardless of when they were closed.
22. As a user, I want to filter the List view by status, so that I can focus on e.g. only Blocked tickets.
23. As a user, I want to filter the List view by one or more Tags, so that I can see tickets matching any of the selected tags.
24. As a user, I want to search Tickets by title, so that I can quickly find a specific one.
25. As a user, I want to paginate through a long List view, so that performance and scannability stay reasonable as history grows.
26. As a user, I want to reopen a closed Ticket by moving it back to another status, so that I can correct a premature close without losing its identity/history.
27. As a user, I want to permanently delete a Ticket after confirming, so that I can clean up mistakes or duplicates.
28. As a user, I want to open a Ticket's detail view, so that I can read/edit its full description, Tags, color, and status in one place.
29. As a user, I want the app to be usable on mobile for quick checks/status changes, so that I can check in while away from my desktop, even though the primary experience targets desktop.
30. As a user, I want my Boards, Tags, and Tickets to be private to my account by default, so that no one else can see or modify them without explicit future sharing.
31. As a user (future), I want the data model to not preclude eventually transferring a Ticket to a friend's Board, so that a later feature doesn't require a schema rewrite (not implemented in v1).
32. As a user, I want secrets/credentials to live in environment variables, so that the app can be deployed to Vercel securely.

## Implementation Decisions

- **Framework**: Next.js App Router + TypeScript, deployed on Vercel.
- **Database**: Neon serverless Postgres via Drizzle ORM (`drizzle-orm` + `@neondatabase/serverless`), migrations via `drizzle-kit`.
- **Auth**: Auth.js v5, Credentials provider only (email + bcrypt-hashed password), JWT session strategy (no DB adapter/sessions table — Auth.js's database session strategy isn't supported alongside Credentials). Passkey/OAuth can be added later as additional providers without restructuring the `users` table.
- **Conceptual data model**:
  - `users`: id (uuid), email (unique), password_hash, name, timestamps
  - `boards`: id (uuid), owner_id → users, name, key (≤4 uppercase letters), unique(owner_id, key), timestamps
  - `tags`: id (uuid), board_id → boards, name, color, unique(board_id, name), timestamps
  - `tickets`: id (uuid), board_id → boards, number (int, unique per board, allocated via atomic counter on the board row), title, description (markdown text), status (enum), color (enum, fixed palette), position (float, scoped to board+status), closed_at (nullable, set/cleared on transitions into/out of `关闭`), timestamps
  - `ticket_tags`: ticket_id → tickets, tag_id → tags (composite PK, many-to-many)
- **Ticket numbering**: allocated atomically (`UPDATE boards SET next_ticket_number = next_ticket_number + 1 ... RETURNING`) inside the same transaction as ticket creation.
- **Kanban "closed" filter**: `status = 'closed' AND closed_at >= now() - interval '7 days'`; List view has no such filter and shows all statuses/history.
- **Drag and drop**: `@dnd-kit` for cross-column status changes and within-column manual reordering (fractional `position` insert between neighbors).
- **Validation**: `zod` schemas shared between Server Actions and forms.
- **Mutations**: Next.js Server Actions (no separate REST API layer); every mutation checks the session user owns the target board.
- **UI**: Tailwind CSS + shadcn/ui primitives (dialog, dropdown, badge, button).
- No file upload/object storage, no comments/activity log, no priority field, no per-board custom workflows in v1.

## Out of Scope

- Multi-user collaboration on a single Board (comments, activity log, shared editing)
- Ticket transfer between users' Boards (data model allows it later; no UI/logic now)
- File/image attachments, object storage
- Custom/configurable workflows or statuses per Board
- Priority field
- Passkey/OAuth login (planned later, not v1)
- Native mobile app / offline support

## Further Notes

- Cost target: stay within Neon Free + Vercel Hobby; revisit only if usage grows beyond personal + a few friends.
- Board Key is mutable by design (see `CONTEXT.md`); changing it changes future display prefixes only, not historical ticket identity.
