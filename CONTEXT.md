# Ticket Record

A personal, simplified Jira-style board: Boards for scenarios, Tags for classification, sticky-note Tickets with a fixed status workflow. Not a team collaboration tool.

## Language

**Board**:
An independent tracking space for one scenario (e.g. personal vs work). Each Board has one Owner, its own Tags, and its own Ticket number sequence.
_Avoid_: Project, Workspace

**Board Key**:
Short Board identifier, set manually at creation, up to 4 uppercase letters (e.g. `WORK`), unique per Owner, mutable afterward. Used in display ids like `WORK-12`.
_Avoid_: Board Code, Prefix

**Ticket**:
A trackable unit of work: title, optional Markdown description (summary / design notes), status, sticky color, Board, zero or more Tags. Not a Jira Story — Tags replace that classification role.
_Avoid_: Issue, Task, Story

**Ticket Number**:
Per-Board sequential display number starting at 1. Shown as `{Board Key}-{Ticket Number}`. Internal identity is a UUID.
_Avoid_: Ticket ID (ID means the UUID; Number is the display field)

**Tag**:
A free-form label owned by one Board. Meaning is Owner-defined. Many Tags per Ticket; Tags are never shared across Boards.
_Avoid_: Label

**Status**:
Fixed Ticket workflow, global (not per-Board): `To Do`, `In Progress`, `Blocked`, `Closed`. Stored as `todo` / `in_progress` / `blocked` / `closed`.
_Avoid_: Workflow, Stage, Done (UI says Closed, not Done)

**Update**:
A chronological progress-log entry on a Ticket: Markdown body only. Ordered oldest→newest; new entries append at the bottom (chat-like). Hard-deletable with confirm; inline-editable; no edit badge / version history. Distinct from Description (optional summary) and from Comments (out of scope as a collaboration feature).
_Avoid_: Comment, Activity Log, Note

**Owner**:
The user who owns one or more Boards. v1 has no Board members.
_Avoid_: User (when the ownership relation is what matters)

**Ticket Color**:
Sticky-note palette color on a Ticket (and Tags). Visual only; not priority.
_Avoid_: Priority

**Position**:
Manual sort order within a Board + Status column, set by drag-and-drop.
_Avoid_: Priority, Rank

## Out of Scope

- **Priority** field — use Position instead
- **Comment / Activity Log** as collaboration features — Updates are a personal progress log only
- **Attachment** uploads — Markdown links only
- **Board sharing / Ticket transfer** between Owners — model may allow later; not implemented
