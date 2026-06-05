# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: my-server

A minimal Express.js 5 web server. No build step, no tests, no linter configured.

### Running the server

```bash
node app.js
# Server starts at http://localhost:8080
```

Install dependencies first if `node_modules` is missing:

```bash
npm install
```

### Architecture

`app.js` is the entire server — a single file with all routes and static file middleware. `express.static('public')` is registered before the route handlers, so `public/index.html` is served for `GET /` (the plain-text route handler for `/` is shadowed by the static file).

Data is persisted to two JSON files in the project root: `bookmarks.json` and `events.json`. Both are read and written synchronously on every request. User isolation is implemented via a `browserId` (a UUID generated in `localStorage` on the client and sent with every request); all API endpoints require `browserId`.

### Routes

**Pages**
- `GET /` — serves `public/index.html` (static middleware takes precedence over the route handler)
- `GET /about` — plain-text about page
- `GET /contact` — serves `public/contact.html`
- `GET /bookmarks` — serves `public/bookmarks.html`
- `GET /calendar` — serves `public/calendar.html`

**Bookmarks API** — all endpoints require `browserId`; responses are always scoped to that `browserId`
- `GET /api/bookmarks?browserId=` — list bookmarks for the given browser
- `POST /api/bookmarks` — create a bookmark; body: `{ title, url, browserId }`; `url` must be `http` or `https`
- `DELETE /api/bookmarks/:id?browserId=` — delete a bookmark; only succeeds if the bookmark belongs to the given `browserId`

**Events API** — all endpoints require `browserId`
- `GET /api/events?browserId=&month=` — list events; `month` is optional and filters by `YYYY-MM` prefix
- `POST /api/events` — create an event; body: `{ date, title, startTime?, endTime?, browserId }`; rejects overlapping events, invalid time formats (`HH:MM`), and `endTime ≤ startTime`
- `DELETE /api/events/:id?browserId=` — delete an event; only succeeds if the event belongs to the given `browserId`

**Utility**
- `GET /api/time` — JSON with current `time` and `date` fields
- `POST /api/contact` — logs a contact form submission; body: `{ name, email, message }`

### Other files in this directory

- `dump/gutenoogleberg/` — MongoDB BSON dump of the `gutenoogleberg` database (English text corpus)
- `person100k.bson.gz` — compressed BSON data file
- `mongodb-database-tools-ubuntu2404-x86_64-100.13.0.*` — MongoDB database tools installer packages
- `hello.js` — standalone one-liner script (`node hello.js`), not part of the server
- `tradecraft.pem` — key file
