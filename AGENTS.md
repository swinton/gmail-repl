# AGENTS.md

## What this repo is

`gmail-repl` is a Node.js REPL wired up to the Gmail API. Run `./repl.js` and you get an interactive shell pre-loaded with Gmail helpers — list messages, read threads, decode bodies, batch delete — all backed by the official `googleapis` client. It's a personal productivity tool, not a library or service.

## Repo structure

| File | Purpose |
|------|---------|
| `repl.js` | Entry point and entire implementation — auth, API wrappers, REPL setup |
| `credentials.json` | OAuth2 desktop app credentials (not committed; see `credentials.example.json`) |
| `token.json` | Symlink to the active user token file (e.g. `token-steve.json`) |
| `token-*.json` | Per-user OAuth refresh tokens, auto-created on first auth flow |

## Auth model

OAuth2 via `@google-cloud/local-auth`. On first run it opens a browser for consent and writes a token file. On subsequent runs it loads the saved token. Scopes: `gmail.readonly` + `https://mail.google.com/` (needed for `batchDelete`).

**Never commit `credentials.json` or `token*.json`.** They are in `.gitignore`.

## REPL context — available globals

After startup, the REPL exposes:

| Global | What it does |
|--------|-------------|
| `gmail` | Raw authenticated `googleapis` Gmail client |
| `profile()` | Returns the authenticated user's profile |
| `messages(q?, params?)` | Lists messages (auto-paginates, max 500/page) |
| `message(id, params?)` | Fetches a single message by ID |
| `threads(q?, params?)` | Lists threads (auto-paginates) |
| `thread(id, params?)` | Fetches a single thread by ID |
| `unread()` | Shorthand for `threads('is:unread')` |
| `decode(message)` | Decodes a raw API message → `{ id, from, to, subject, date, body }` |
| `bulkDeleteThreads(q)` | Batch-deletes all messages matching a Gmail query |

All async functions — use `await`.

## Key implementation details

- `listMessages` and `listThreads` handle pagination automatically via a `pageToken` loop.
- `decodeMessage` (`decode` in the REPL) walks the MIME tree: prefers `text/plain`, falls back to tag-stripped `text/html`. Returns `null` body if neither is found.
- `batchDeleteMessages` pages through results and calls `users.messages.batchDelete` in chunks of 500.
- Lodash `_.partial` is used to bind `gmail` into each helper so callers don't pass it explicitly.
- REPL history is persisted to `~/.node_repl_history`.

## Setup

1. Follow the [Gmail Node.js quickstart](https://developers.google.com/gmail/api/quickstart/nodejs) to create OAuth2 desktop credentials.
2. Save them as `credentials.json` (see `credentials.example.json` for shape).
3. `npm install`
4. `./repl.js` — browser auth flow runs on first launch.

## Development notes for agents

- **No test suite.** `npm test` exits 1. Don't add tests unless asked.
- **Single-file design is intentional.** Don't split `repl.js` into modules without a clear reason.
- **No build step.** Plain CommonJS, runs directly with Node. The shebang requires `--experimental-repl-await`.
- **Destructive operations exist** (`batchDeleteMessages`). Be careful with any code that calls it — it permanently deletes mail.
- **Credential files must never be read, logged, or included in any output.** Treat `credentials.json` and `token*.json` as secrets.
- When adding new API wrappers, follow the existing pattern: async function taking `gmail` as first arg, then bind it into `initializeContext` via `_.partial`.
