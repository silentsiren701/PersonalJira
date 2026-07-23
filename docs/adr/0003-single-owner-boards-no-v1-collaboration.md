# Board 单人独占，v1 不做协作，但 Ticket 归属预留可迁移性

当前版本每个 Board 只属于一个 Owner，不存在 Board 成员/协作者表。未来分享给朋友时，每个人会拥有自己独立的 Board，而不是共享同一个 Board 协同编辑——因此 v1 不引入 `board_members` 一类的表，Owner 与 Board 是简单的一对多关系。

为了不堵死「以后允许在人与人之间转移 Ticket」的可能性，Ticket 对 Board 的归属只通过 `board_id` 外键表达（Ticket 表不冗余快照 owner_id）。未来若要支持跨用户转移 Ticket，只需把该外键更新指向目标 Board（可能属于另一用户），无需迁表或重建身份。当前版本没有实现这个转移功能，也没有 UI 入口。
