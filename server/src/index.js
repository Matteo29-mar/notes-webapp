import express from "express";
import cors from "cors";
import morgan from "morgan";
import { db } from "./db.js";
import { containsImages, htmlToDocxBuffer, htmlToPlainText } from "./export.js";

const app = express();
const PORT = process.env.PORT || 5174;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "15mb" })); // allow base64 images from editor

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// List notes
app.get("/api/notes", (_req, res) => {
  const rows = db.prepare("SELECT id, title, created_at, updated_at FROM notes ORDER BY updated_at DESC").all();
  res.json(rows);
});

// Get note
app.get("/api/notes/:id", (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare("SELECT * FROM notes WHERE id=?").get(id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

// Create note
app.post("/api/notes", (req, res) => {
  const { title, content_html } = req.body ?? {};
  if (!title || typeof title !== "string") return res.status(400).json({ error: "title required" });
  if (typeof content_html !== "string") return res.status(400).json({ error: "content_html required" });

  const now = new Date().toISOString();
  const info = db.prepare(
    "INSERT INTO notes (title, content_html, created_at, updated_at) VALUES (?, ?, ?, ?)"
  ).run(title.trim(), content_html, now, now);

  const created = db.prepare("SELECT * FROM notes WHERE id=?").get(info.lastInsertRowid);
  res.status(201).json(created);
});

// Update note
app.put("/api/notes/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, content_html } = req.body ?? {};
  const row = db.prepare("SELECT * FROM notes WHERE id=?").get(id);
  if (!row) return res.status(404).json({ error: "Not found" });

  const newTitle = (typeof title === "string" && title.trim().length) ? title.trim() : row.title;
  const newHtml = (typeof content_html === "string") ? content_html : row.content_html;
  const now = new Date().toISOString();

  db.prepare("UPDATE notes SET title=?, content_html=?, updated_at=? WHERE id=?")
    .run(newTitle, newHtml, now, id);

  const updated = db.prepare("SELECT * FROM notes WHERE id=?").get(id);
  res.json(updated);
});

// Delete note
app.delete("/api/notes/:id", (req, res) => {
  const id = Number(req.params.id);
  db.prepare("DELETE FROM notes WHERE id=?").run(id);
  res.status(204).end();
});

// Download (txt if no images, otherwise docx)
app.get("/api/notes/:id/download", async (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare("SELECT * FROM notes WHERE id=?").get(id);
  if (!row) return res.status(404).json({ error: "Not found" });

  const safeTitle = (row.title || "note").replace(/[^a-z0-9\-\_ ]/gi, "").trim().replace(/\s+/g, "-").toLowerCase();

  if (containsImages(row.content_html)) {
    const buf = await htmlToDocxBuffer(row.content_html);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle || "note"}-${id}.docx"`);
    return res.send(buf);
  }

  const text = htmlToPlainText(row.content_html);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${safeTitle || "note"}-${id}.txt"`);
  res.send(text);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
