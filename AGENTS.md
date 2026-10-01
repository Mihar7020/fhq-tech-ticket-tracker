# ChatGPT project context

This directory is a local mirror of the ChatGPT project “Ticketing System”.

- Treat every file under `sources/` as read-only reference material.
- Do not edit, rename, move, or delete synced project files.
- These files may be replaced the next time a task is created from this ChatGPT project.


## Project instructions

This project has no custom instructions.

## Development rules (from the repo owner)
- Protected scope: authentication/sign-in, roles/permissions, email intake, threading, the Graph webhook/subscription/cron, and the database schema. Before changing any of these, STOP: explain the exact change, why it's needed, the files and data affected, migration or access impact, and safer alternatives. Then wait for explicit approval.
- One feature per change. Never bundle unrequested changes or "while I'm here" improvements.
- Only IT staff can sign in, and all of them are admins. Do not add role checks or admin-only features.
- Do not add Microsoft 365 account tools (create user, reset password, licenses).
- Every change must pass `npm run lint`, `npm test` and `npm run build`, and must list every file touched.
