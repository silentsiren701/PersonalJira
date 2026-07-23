# Ticket Record（个人 Ticket 追踪工具）

一个人使用的、简化版私人 Jira 看板：按 Board 分场景管理 Ticket，用 Tag 分类，用固定状态列追踪进度。原型隐喻是便签纸（手动排序、固定色板），不是团队协作工具。

## Language

**Board**:
一个独立的任务追踪空间，对应一个使用场景（如「个人」「公司」）。每个 Board 属于唯一一个 Owner，拥有自己的一套 Tag 和独立的 Ticket 编号序列。
_Avoid_: Project, Workspace

**Board Key**:
Board 的短标识，创建时手动填写，最多 4 位大写字母（如 `WORK`），同一 Owner 下唯一，创建后允许修改。用于拼出 Ticket 的展示编号（如 `WORK-12`）。
_Avoid_: Board Code, Prefix

**Ticket**:
一条待追踪的任务，包含标题、Markdown 简介、状态、便签色、所属 Board、零或多个 Tag。类比 Jira 的 Issue，但没有子任务、故事点、经办人、优先级等概念。
_Avoid_: Issue, Task, Story（本项目故意不用 Story，用 Tag 代替其分类作用）

**Ticket Number**:
Ticket 在其所属 Board 内的顺序编号，从 1 递增，同一 Board 内不重复、不复用。展示为 `{Board Key}-{Ticket Number}`（如 `WORK-12`）。Ticket 的内部唯一标识是 UUID，Number 只是派生的展示字段。
_Avoid_: Ticket ID（ID 指内部 UUID，与 Number 是两个不同的字段）

**Tag**:
归属于某个 Board 的自由分类标签，含义由 Owner 自行定义、系统不做语义解释。一个 Ticket 可挂多个 Tag，Tag 不跨 Board 共享、不跨 Board 复用。
_Avoid_: Label

**Status**:
Ticket 的进度状态，固定四种：`未开始`、`进行中`、`Blocked`、`关闭`。全局统一，不可按 Board 自定义或扩展。
_Avoid_: Workflow, Stage

**Owner**:
拥有一个或多个 Board 的用户。当前版本每个 Board 只有一个 Owner，没有协作者/成员概念。
_Avoid_: User（Owner 强调「这是谁的 Board」这一归属关系；User 泛指账户本身）

**便签色 / Ticket Color**:
Ticket 卡片的视觉颜色，从一组固定便签色板中选择，纯视觉分类，不影响状态、排序或任何业务逻辑。
_Avoid_: Priority（本项目明确不做优先级字段；颜色与优先级无关）

**手动排序 / Position**:
同一 Board、同一 Status 列内 Ticket 的先后顺序，由 Owner 手动拖拽决定，代替优先级字段表达「先做哪个」。
_Avoid_: Priority, Rank

## Out of Scope（当前版本明确不做的概念）

- **Priority**（优先级字段）：用手动排序代替
- **Comment / Activity Log**（评论/动态流）：Markdown 简介本身承载记录，未来协作需求出现后再引入
- **Attachment**（附件上传）：靠 Markdown 外链，不引入对象存储
- **Board 协作 / Ticket Transfer**（跨 Owner 的 Board 共享或 Ticket 转移）：数据模型不堵死，但当前不实现
