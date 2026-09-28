# Handoff

## Goal

Implement auth for the shop API in stages (`docs/AUTH-PLAN.md`). Admin manages users under `/admin`; users sign up and log in themselves under `/auth`. Stage 1 (users + signup/login, no JWT) is finished and tagged. Next is stage 2: JWT, `GET /me`, lock `/admin`.

## Done

- Stage 1 committed and pushed: `012410c` on `main` (tracks `origin/main`, in sync). Earlier part in `1c410a1`.
- Tag `chapter-auth-users` on `012410c`, pushed. Release: https://github.com/engmagdy87/backend-concepts/releases/tag/chapter-auth-users
- `npx tsc --noEmit -p .` → no type errors (last run before commit).
- `User#toJSON` verified with a `tsx` script: `JSON.stringify` of a user and an array of users had no `password`; `user.password` still readable in code.
- MySQL `UNIQUE (email)` on `users` — user confirmed in Workbench.
- Postman local file and cloud collection replaced to match (18 requests: Admin, Shop, Cart, User, Auth). Cloud read back after `putCollection` → matches.
- `CHANGELOG.md` `[Unreleased]` and `docs/LEARNING.md` (three 2026-09-28 entries) updated in `012410c`.
- `docs/AUTH-PLAN.md`: Stages table + checkboxes (step 1 done, step 2 only JWT left).
- Not verified: endpoints were never called over HTTP in this session (no Postman/curl run). Only type-check + the `toJSON` script.

## In progress

- Branch `main`, working tree clean. Nothing half-done.
- Login returns `{ message, data: user }` — JWT not started.

## Files

- `services/user.service.ts` — `createUserService` (email check → `hashPassword` → save; `null` if email taken), `updateUserService` (returns `UpdateUserResult`; comment above it: full-replace PUT, TODO partial PATCH).
- `services/auth.service.ts` — `signupService` → `createUserService`; `loginService` → `User | null` (null for wrong email or password).
- `controllers/users.controller.ts` — admin CRUD; `findMissingFields` + `USER_REQUIRED_FIELDS`; delete uses `req.body?.id ?? ""`.
- `controllers/auth.controller.ts` — `signup` (400/409/201), `login` (400/401/200).
- `models/user.model.ts` — TypeORM `User`, `email` `unique: true`, `toJSON()` omits `password`.
- `types/user.types.ts` — `UserInput`, `UserOutput` (no `password`), `USER_REQUIRED_FIELDS`, `UpdateUserResult`.
- `types/auth.types.ts` — `SignupBody` (all fields required), `LoginBody`.
- `utils/password.utils.ts` — `hashPassword`, `verifyPassword`, `SALT_ROUNDS = 10`. Only file importing `bcrypt`.
- `utils/validation.utils.ts` — `findMissingFields<T>(body, fields)`.
- `utils/number.utils.ts` — `parseId` (moved from `Product`).
- `routes/admin.route.ts`, `routes/auth.route.ts`, `app.ts` — `/admin`, `/auth` mounted.
- `postman/backend-concepts.postman_collection.json` — now carries Postman item IDs; `userId` variable set by "Add user" script.
- `.cursor/rules/postman-collection.mdc` — cloud UID now `35152687-d8a8ccff-2ddb-4ad1-950a-5278c57b5cc8`, workspace `backend-concepts` (`cab9cbc2-cfad-498f-ad8b-637d9fe456e5`). Old UID returned 404.
- `.cursor/rules/chapter-releases.mdc` — auth tagged in stages.
- `docs/AUTH-PLAN.md` — plan, stages, progress.

## Decisions

- Email uniqueness lives in the service, shared by admin add-user and signup. DB unique key is the real guarantee (races). 409 for taken email.
- Update returns a discriminated union `{ status: "ok" | "not_found" | "email_in_use" }`. Rejected: returning the other user's object as a signal (controller compared ids backwards).
- Update is full-replace `PUT`; password required and always re-hashed. Partial update / separate password endpoint deferred (TODO comment).
- Keep `*Service` suffix (repo convention). Renamed `addUserService` → `createUserService`.
- Hide hash via `toJSON`. Known limit: `{ ...user }` leaks it. Stronger later: `select: false` column; in Prisma use `omit`.
- Login: one message "Invalid email or password" (user enumeration). Timing dummy-hash fix is optional, not done.
- Validation in controllers via util, not middleware yet (no `middlewares/` folder until step 3). `zod` later for types/format.
- Chapter tags per auth stage, descriptive names: `chapter-auth-users` → `chapter-auth-jwt` → `chapter-auth-cart`. Rejected `v1/v2` (reserved for API SemVer) and alpha/beta (implies unstable same release).

## Constraints

- Side-chat style: review/explain by default; edit files only when the user explicitly asks.
- User wants short, simple-language answers, often as points.
- Commit only when asked; don't force-push. Push to `main` needs explicit confirmation (auto-review blocks otherwise).
- `synchronize: false` — schema changes are manual SQL.
- Postman: update local file and cloud (`putCollection`) together on endpoint changes; keep item IDs.
- CHANGELOG + LEARNING in the same commit as finished features.

## Blocked / open

- None.
- Signup still reveals existing emails via 409 (accepted until email verification exists).
- `findMissingFields` checks presence only: `{ "password": 123 }` passes then bcrypt throws → 500.

## Next

1. Plan step 2: login issues a JWT (`{ userId, email }`, short expiry, secret from `.env`); response `{ token }`.
2. Step 3: `middlewares/` auth middleware (`Authorization: Bearer`) → `req.user`; `GET /me`.
3. Step 6: lock `/admin`; update Postman (Bearer auth, `GET /me`) local + cloud; tag `chapter-auth-jwt` when done.
