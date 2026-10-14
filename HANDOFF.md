# Handoff

## Goal

Implement auth for the shop API in stages (`docs/AUTH-PLAN.md`). Stages 1–2 are tagged and released (`chapter-auth-users`, `chapter-auth-jwt`). Stage 3 (`chapter-auth-cart`: a cart per guest or user) is implemented on branch `fix/per-owner-cart` and waiting for the user's review. After that: merge → push → tag + release.

## Done

- **Stage 2 released:** `main` pushed (`0d6a67c`), and GitHub Release `chapter-auth-jwt` published on `0d6a67c` (2026-10-14).
- **Review file:** `CODE_REVIEW.md` (untracked). It was rewritten 2026-10-14 with "When: Now / Next / Later" labels for a learning project, and a status board.
- **Stage 3 on branch `fix/per-owner-cart`:**
  - `d5d083d` (committed, C1): `carts.guestToken` / `carts.userId` (both `UNIQUE`, `userId INT UNSIGNED` FK → `users.id`). `optionalAuth`, `resolveCartOwner` (`HttpOnly` `guestCart` cookie, `Path=/cart`, 30 days), `Cart.getOrCreate(owner)` with duplicate-key retry, `cookie-parser`. The user ran the SQL on the dev DB.
  - **Uncommitted (C1a):** `Cart.attachGuestCart` + `attachGuestCartService`. On the first `/cart` request with a token and the guest cookie, the guest cart goes to the user if they have no cart yet, and the cookie is cleared. If the user already has a cart, both are left alone. Also updated: README, AUTH-PLAN (step 5 ticked), CHANGELOG, LEARNING (2026-10-14 entry), and the Postman collection (Cart descriptions + new "Get cart (logged in)" request).
  - HTTP-verified by hand: separate guest carts, user cart, 401 on a bad token, one cart after parallel first requests, attach after login, existing user cart left alone. Test users and carts were deleted afterwards; `carts` is empty.
- **Postman cloud synced** 2026-10-14 via the REST API `PUT` (full replace; read back: item ids and descriptions match). Before the PUT, the cloud copy matched the committed local file.
- **`CLAUDE.md`** added (uncommitted). It imports `.cursor/rules/*.mdc`, so Claude Code follows the same rules.

## In progress

- Waiting for the user to review the uncommitted C1a changes, `CLAUDE.md`, and this file.

## Decisions

- **Attach happens on `/cart`, not in `/auth/login`:** the cookie has `Path=/cart`, so `/auth/login` never sees it.
- **Basic attach only.** Combining two carts (summing quantities) stays in AUTH-PLAN's "Nice to have".
- **`optionalAuth`:** no header → guest; a header that's present but bad → 401 (no silent fallback to the guest cart).
- **H5 (parallel add/remove lost updates) is parked as "Later".** An atomic-SQL + row-lock fix was written, then undone at the user's request as too advanced for now. The simple `increment`/`decrement` version is noted in `CODE_REVIEW.md`.
- **Earlier decisions (still valid):**
  - The role comes from the JWT.
  - The first admin is created by SQL.
  - Delete ids go in the path.
  - RPC-style paths are kept.
  - Postman auth is set on folders.
  - One chapter tag per auth stage.

## Constraints

- **Learning project:** explain in simple language and keep fixes basic; label advanced topics "later".
- **One step at a time:** fix review points one at a time and wait for confirmation.
- **No unasked commits:** don't commit or push unless asked. Push to `main` needs explicit confirmation.
- **Manual schema:** `synchronize: false`, so schema changes are manual SQL that the user runs.
- **Postman:** update the local file, then do a cloud full replace on every endpoint change. The key is in `~/.cursor/mcp.json`; use it only with the user's OK.
- **Docs with code:** CHANGELOG + LEARNING go in the same commit as finished features.

## Blocked / open

- **`chapter-auth-jwt` is a lightweight tag.** The chapter-releases rule wants an annotated tag. Replacing it needs a force-push of the tag, which Claude Code's permission check blocked. The user can run:
  ```bash
  git tag -f -a chapter-auth-jwt 0d6a67c -m "Auth stage 2: JWT on login, GET /auth/me, roles, /admin locked to admins"
  git push --force origin refs/tags/chapter-auth-jwt
  ```
- **Leftovers from the review:**
  - C1b: empty guest carts pile up.
  - Signup reveals existing emails via 409 (accepted).
  - `findMissingFields` checks presence only (H3).
  - Unused `ProductIdInput` / `UserIdInput`.
- **`docs/BACKEND-REFERENCE.md`:** the "This repo (snapshot)" section is out of date. Only update it when the user asks for the mentor/notebook.

## Next

1. After the user's review: commit C1a + docs + Postman + `CLAUDE.md` on `fix/per-owner-cart`.
2. Merge into `main` and push (with confirmation).
3. Create the annotated tag `chapter-auth-cart` and the GitHub Release (same style as earlier releases).
4. Then the quick wins from `CODE_REVIEW.md`: H1, M1, M12, L3, L4.
