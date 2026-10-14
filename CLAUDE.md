# backend-concepts

Express + TypeScript learning project (MySQL via TypeORM). The user is learning backend basics chapter by chapter: keep fixes simple, explain in plain language, and label advanced topics as "later".

The project rules started in Cursor. They are shared here so Claude Code follows the same ones:

@.cursor/rules/handoff.mdc
@.cursor/rules/progress-log.mdc
@.cursor/rules/chapter-releases.mdc
@.cursor/rules/postman-collection.mdc
@.cursor/rules/architect-mentor.mdc
@.cursor/rules/backend-reference.mdc

## Notes for Claude Code

- Read `HANDOFF.md` first when it exists (see the handoff rule above).
- Postman cloud sync: there's no Postman MCP here. Use the Postman REST API (`PUT https://api.getpostman.com/collections/<uid>` with the local file). The API key is in `~/.cursor/mcp.json` (`postman-api-mcp`). Ask before using it, and never print it.
- `synchronize: false`: schema changes are manual SQL. The user runs them; record them in `docs/AUTH-PLAN.md` (or the relevant doc).
- Check with `npx tsc --noEmit -p .`. There are no automated tests yet.
- Don't commit or push unless asked.
