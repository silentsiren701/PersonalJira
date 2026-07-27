# Ticket Updates as a personal progress log (not comments)

Ticket detail is a wide split panel: left side holds the Ticket body (title, optional Markdown description as summary/design notes, tags, color, status); right side holds an Update chain — lightweight chat-style bubbles, oldest at top, newest at bottom, composer pinned at the bottom.

Updates are Markdown-only progress entries. They are hard-deleted after confirm and edited inline; there is no "edited" badge or version history. Ticket-level `updatedAt` (gray text, bottom-right of the detail) refreshes on any Ticket body change or any Update create/edit/delete. Left-panel fields autosave on blur (discrete controls save immediately); sending an Update is a separate explicit action.

UI terminology is English (`To Do` / `In Progress` / `Blocked` / `Closed`, "Update", etc.). Status enum value `not_started` was renamed to `todo` to match the To Do column; `closed` remains (UI label Closed, not Done).
