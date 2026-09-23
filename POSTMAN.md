# Postman notes (this project)

Cloud workspace: **backend-concepts**. Collection: [`postman/backend-concepts.postman_collection.json`](postman/backend-concepts.postman_collection.json). This API uses **raw → JSON** bodies.

---

## Environments

### Duplicate an environment

Yes. Sidebar → **Environments** → right-click (or ⋯) on an env → **Duplicate**. Rename the copy (e.g. `Local` → `Staging`) and change `baseUrl`.

### Local value vs cloud (Share value)

In the current Postman UI there is **one Value** per variable (no separate “Initial / Current” columns).

| | Local value | Shared value |
| --- | --- | --- |
| Used when you Send on this machine | Yes | Yes (if set) |
| Synced to Postman cloud / MCP / teammates | **No** | **Yes** |

- Collection edits (description, requests, scripts) sync to the cloud automatically when signed in.
- Env **names** sync; env **values** stay local until you use the **Share** (cloud) control **on that variable’s value**.
- That “Share” is **not** the same as **Invite** another developer to the workspace. Invite = people access. Share value = put this value on the cloud copy of the env.

If desktop has `baseUrl` filled but cloud/MCP shows empty, the value was never shared — your local Sends still work.

### Team vs personal (why two names in the profile menu)

- **Your name** = user account (keep this).
- **solar-comet-…** (or similar) = free **team** Postman creates — not a second login.
- MCP reads the **team** workspace. **My Workspace** (personal) can be empty while **backend-concepts** (team) has the real collection.

---

## Scripts tab naming

| Older docs / API | Current desktop UI |
| --- | --- |
| Pre-request | **Before request** (or similar) |
| Tests / post-response | **Scripts → After response** |

Same idea: run JS after the response. Example on **Add product** (set `productId` for later requests):

```javascript
const json = pm.response.json();
const id = json.data?.id ?? json.id;
if (id != null) {
  pm.collectionVariables.set("productId", String(id));
}
```

---

## Request body types

Use the **Body** tab. Pick the type that matches what the API expects (`Content-Type` in the docs).

## All body types

| Type | What it sends | Files? | Nested / typed data? | Content-Type (typical) | Use when |
| --- | --- | --- | --- | --- | --- |
| **none** | No body | — | — | — | `GET`, `DELETE`, or query/headers only |
| **x-www-form-urlencoded** | `key=value&key=value` | No | Flat strings only | `application/x-www-form-urlencoded` | Simple forms, no files |
| **form-data** | Named multipart parts | Yes | Flat parts (text or file) | `multipart/form-data` | File + other fields |
| **raw → JSON** | `{ "key": "value" }` | No* | Yes (objects, arrays, numbers, …) | `application/json` | Most modern REST APIs |
| **raw → Text / XML / HTML / JS** | Free-form text in that format | No* | Depends on format | Matching type (e.g. `application/xml`) | APIs that expect that text format |
| **binary** | One file as the entire body | Yes (one) | No | You often set it yourself | API wants only the file |
| **GraphQL** | Query + variables | No* | Yes (variables as JSON) | `application/json` | GraphQL over HTTP |

\*File contents can be base64-encoded inside JSON/text if the API asks for that — that is not a Postman “file” picker like form-data/binary.

## form-data vs x-www-form-urlencoded vs binary

| Type | What it sends | Files? | Extra text fields? | Typical use |
| --- | --- | --- | --- | --- |
| **x-www-form-urlencoded** | One string of `key=value&key=value` | No | Yes (text only) | Simple forms (login, settings) |
| **form-data** | Multipart parts, each with a name | Yes | Yes (text + files) | Upload with metadata (`title` + `photo`) |
| **binary** | The file bytes alone as the whole body | Yes (one file) | No | API wants only the file |

**Rule of thumb:** no file → urlencoded; file + fields → form-data; only the file → binary.

## x-www-form-urlencoded vs raw (JSON)

| | **x-www-form-urlencoded** | **raw (JSON)** |
| --- | --- | --- |
| **Shape** | `name=Maya&age=30` | `{ "name": "Maya", "age": 30 }` |
| **Content-Type** | `application/x-www-form-urlencoded` | `application/json` |
| **Nesting** | Flat keys only | Objects, arrays, nested structure |
| **Types** | Everything is a string | Numbers, booleans, null, objects, arrays |
| **Who uses it** | Classic HTML forms, older APIs | Most modern REST APIs |

Same data, different packaging:

```
urlencoded:  name=Maya&age=30
JSON:        { "name": "Maya", "age": 30 }
```

## Quick pick

| Need | Body type |
| --- | --- |
| JSON REST API (this project) | **raw → JSON** |
| Form fields, no file | **x-www-form-urlencoded** |
| File + other fields | **form-data** |
| Single file only | **binary** |
| GraphQL | **GraphQL** |
| No body | **none** |

## Docs

- [Request body](https://learning.postman.com/docs/use/send-requests/create-requests/parameters)
- [Variables / share values](https://learning.postman.com/docs/use/send-requests/variables/define-variables)
- [Managing environments](https://learning.postman.com/docs/use/send-requests/variables/managing-environments)
- [Syncing](https://learning.postman.com/docs/getting-started/basics/syncing)
