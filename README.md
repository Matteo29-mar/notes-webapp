# Notes Web App (Rich Notes)

A modern web app to create online notes with formatting (fonts, sizes, colors, bold/italic) and images.
Notes are stored in a SQLite database via the backend API.

## Tech
- Frontend: React + Vite + TypeScript + React-Quill (rich text editor)
- Backend: Node.js + Express + SQLite (better-sqlite3)
- Export:
  - If note contains images => .docx
  - If note is text-only => .txt

## Run locally (dev)
### 1) Backend
```bash
cd server
npm install
npm run dev
```

Backend runs on http://localhost:5174

### 2) Frontend
```bash
cd client
npm install
npm run dev
```

Frontend runs on http://localhost:5173 and proxies API calls to the backend.

## Build & run (prod)
```bash
cd client && npm install && npm run build
cd ../server && npm install && npm run start
```

## Notes
- This is a full working starter. For production, add auth, file storage, input sanitization, and backups.
