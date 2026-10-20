# Tag 归属 Board；Ticket 编号按 Board 独立计数

Tag 被设计为归属于单个 Board（不是账户全局），因为不同场景（个人/公司）的分类语言互不相通，切换 Board 时不应互相污染筛选列表。

Ticket 的展示编号（`{Board Key}-{序号}`）按 Board 独立从 1 递增，而不是账户级全局唯一序列，因为编号表达的是「这个场景下第几个任务」，不是「我这个账户下第几个任务」。序号通过 Board 行上的原子计数器（`UPDATE ... RETURNING`）分配，避免额外的每 Board 数据库序列对象。

Ticket 的内部主键始终是 UUID，序号只是派生的展示字段：更改 Board Key 只改变历史 Ticket 展示前缀，不影响其身份或引用。
