# Community Issue Reporter

A beginner-friendly full-stack web application for reporting and tracking local community problems such as damaged roads, broken streetlights, waste collection issues, and water leaks.

## Problem and objectives

Community concerns can be difficult to report and follow up on. This app gives people a shared place to submit an issue, search existing reports, and track whether a report is open, in progress, or resolved.

## Implemented features

- Create, list, view, edit, and delete issue reports.
- Search by title, location, category, or description.
- Filter by status and priority.
- Track total, unresolved, and resolved report counts.
- Set report category and low/medium/high priority.
- Change a report's status from its details.
- Server-side validation, JSON error responses, request-size limit, rate limiting, and security headers.
- Responsive layout for mobile, tablet, and desktop.
- Persistent storage in Supabase PostgreSQL.

## MVP scope and important limitations

This starter version is a **shared public demo board without user accounts**. Anyone who can reach the app can create, edit, change the status of, or delete reports. Do not expose it to the public internet with real or sensitive information as-is. Before public deployment, add authentication, user ownership, and admin-only status/deletion permissions. Photo uploads, duplicate detection, and a dedicated admin dashboard are not implemented in this MVP. Do not submit personal contact details in reports.

## Technology stack

- HTML5, CSS3, Vanilla JavaScript
- Node.js and Express
- Supabase PostgreSQL through `@supabase/supabase-js`
- Git and GitHub

## Folder structure

```text
community-issue-reporter/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── routes/reports.js
│   ├── middleware/
│   ├── utils/validation.js
│   ├── server.js
│   ├── supabase.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── database/schema.sql
├── .gitignore
└── README.md
```

The `middleware/` folder is reserved for future authentication middleware; it is empty in this MVP.

## Prerequisites

Install these tools:
- Visual Studio Code: https://code.visualstudio.com/
- Node.js LTS (includes npm): https://nodejs.org/
- Git: https://git-scm.com/downloads
- Supabase account: https://supabase.com/

Check installation in a terminal:

```powershell
node --version
npm --version
git --version
```

## Setup on Windows

### 1. Open the project

Extract the ZIP, open the `community-issue-reporter` folder in VS Code, then select **Terminal → New Terminal**.

### 2. Create a Supabase project

1. Open https://supabase.com/ and create a project.
2. In the project dashboard, open **SQL Editor** and choose **New query**.
3. Open `database/schema.sql` in VS Code, copy all its contents into the SQL Editor, and run it.
4. In the table editor, verify that the `public.reports` table exists with columns `id`, `title`, `location`, `category`, `priority`, `description`, `status`, `created_at`, and `updated_at`.
5. In **Project Settings → API** (the label may change), copy the project URL and the server-side service-role/secret key. Keep the key private.

### 3. Configure backend environment

In VS Code, create `backend/.env` by copying `backend/.env.example`. Replace the example values with your own project URL and server-side key:

```dotenv
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_REAL_SERVER_SIDE_SECRET_KEY
CORS_ORIGIN=
```

These are placeholders until replaced. Never paste a real key into frontend files, screenshots, GitHub, or this README. The service-role key bypasses RLS, so the Express API must be treated as privileged. Rotate it immediately if exposed.

### 4. Install backend dependencies

In the VS Code terminal, make sure the current directory is the project root (`community-issue-reporter`), then run:

```powershell
cd backend
npm install
```

`npm install` downloads the packages described in `package.json` and creates `package-lock.json`. The lock file is generated locally and is not included in this source ZIP.

### 5. Start the app

From the `backend` folder, run:

```powershell
npm start
```

Expected terminal output:

```text
Community Issue Reporter running at http://localhost:3000
```

Open http://localhost:3000 in your browser. Keep the terminal open while using the app. To stop the server, press `Ctrl+C`.

For development with Node's watch mode, run `npm run dev`.

### 6. Verify the API

Open http://localhost:3000/api/health. It should return JSON with `"status":"ok"`. `"databaseConfigured":true` means the required variables are present; it does not by itself prove the database connection works. After configuring Supabase, try creating a report in the UI and verify the row appears in Supabase's table editor.

## Architecture

Browser (`frontend/index.html`, `styles.css`, `app.js`) sends `fetch()` requests to the Express REST API. Express validates the request, uses the server-side Supabase client, and reads/writes PostgreSQL. The browser never receives the Supabase secret key.

## API endpoints

All responses are JSON.

| Method | Path | Purpose | Request / permission |
|---|---|---|---|
| GET | `/api/health` | Server/configuration health | Public |
| GET | `/api/reports` | List latest reports and counts | Public in demo |
| POST | `/api/reports` | Create a report | JSON: `title`, `location`, `category`, `priority`, `description`; public in demo |
| GET | `/api/reports/:id` | Fetch one report | Public in demo |
| PUT | `/api/reports/:id` | Replace editable report fields | Same required JSON fields; public in demo |
| PATCH | `/api/reports/:id` | Change status | JSON `{ "status": "open" }`, or `in_progress` / `resolved`; public in demo |
| DELETE | `/api/reports/:id` | Delete a report | Public in demo |

Example POST body:

```json
{
  "title": "Streetlight not working",
  "location": "Near the community park",
  "category": "Lighting",
  "priority": "medium",
  "description": "The streetlight has not worked for several evenings."
}
```

Validation errors return HTTP 400 with an `error` message. Missing reports return HTTP 404. If environment variables are missing, report API calls return HTTP 503. Unexpected server failures return HTTP 500 without exposing database details.

## Authentication and security

There is no authentication in this MVP. PostgreSQL RLS is enabled without public policies, preventing direct anonymous access using a public key. The backend uses a privileged server-side key, which bypasses RLS. Therefore, backend routes are effectively public and must not be exposed to untrusted users in a production deployment. Add login, ownership checks, and admin authorization before public hosting. `helmet`, a JSON body-size limit, and rate limiting provide baseline protections, not complete production security.

## Manual testing checklist

1. Open the app and verify the dashboard loads.
2. Create a report with all valid fields; it should appear in the list and total count.
3. Leave a required field blank; the form should prevent submission.
4. Search for a word from the title/location/description; matching reports should remain.
5. Filter by status and priority; results should update.
6. Open Details, change status, and save; the card and counts should update.
7. Edit a report and refresh the page; changes should persist.
8. Delete a report and confirm; it should disappear from the list and database.
9. Try a category or status not listed above by calling the API; the server should reject invalid values.
10. Stop the backend and refresh; the app should show a useful error.
11. Test the layout at desktop and mobile widths.
12. Verify the `reports` table in Supabase after create/update/delete operations.

## Troubleshooting

- **`npm` is not recognized:** reinstall Node.js LTS, restart VS Code, and check `node --version`.
- **PowerShell says scripts are disabled:** use `npm.cmd install` and `npm.cmd start` in PowerShell, or use Command Prompt as the VS Code terminal.
- **Port 3000 is in use:** change `PORT=3001` in `backend/.env`, restart, and open `http://localhost:3001`.
- **Database is not configured / HTTP 503:** check the exact variable names in `backend/.env`, confirm it is inside `backend/`, and restart the server.
- **HTTP 500 or reports do not load:** read the backend terminal message; verify `SUPABASE_URL`, the server-side key, SQL schema, and table name `reports`.
- **Supabase permission or table error:** ensure you ran the full `database/schema.sql` against the same Supabase project used by `.env`.
- **Browser shows an old page:** hard-refresh with `Ctrl+F5`.
- **Git command not found:** install Git and restart VS Code.

## GitHub upload

From the project root:

```powershell
git init
git status
git add .
git status
git commit -m "Build Community Issue Reporter"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the URL of your own empty GitHub repository. Before `git add .`, confirm that `.env`, `node_modules/`, and private data are ignored. If a secret was already committed, `.gitignore` does not erase it: rotate the key and remove it from repository history as appropriate.

## Future improvements

- Add Supabase Auth, per-user report ownership, and admin-only actions.
- Add safe photo attachments using Supabase Storage with access policies.
- Add duplicate issue suggestions and a dedicated admin dashboard.
- Add automated integration tests and deployment-specific security configuration.
