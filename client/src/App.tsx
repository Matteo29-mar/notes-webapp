import { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill";
import { NotesAPI, NoteListItem, Note } from "./api";
import { Plus, Save, Download, Trash2, X } from "lucide-react";

const emptyHtml = "<p><br></p>";

export default function App() {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [active, setActive] = useState<Note | null>(null);
  const [editorHtml, setEditorHtml] = useState<string>(emptyHtml);
  const [title, setTitle] = useState<string>("New note");
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ font: [] }, { size: [] }],
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["image", "clean"],
      ],
    }),
    []
  );

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      const list = await NotesAPI.list();
      setNotes(list);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  async function openNote(id: number) {
    setError(null);
    setBusy(true);
    try {
      const n = await NotesAPI.get(id);
      setActive(n);
      setTitle(n.title);
      setEditorHtml(n.content_html || emptyHtml);
      setIsOpen(true);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  function newNote() {
    setActive(null);
    setTitle("New note");
    setEditorHtml(emptyHtml);
    setIsOpen(true);
    setError(null);
  }

  async function save() {
    setError(null);
    setBusy(true);
    try {
      if (active) {
        const updated = await NotesAPI.update(active.id, title, editorHtml);
        setActive(updated);
      } else {
        const created = await NotesAPI.create(title, editorHtml);
        setActive(created);
      }
      await refresh();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!active) return;
    setBusy(true);
    try {
      await NotesAPI.remove(active.id);
      setActive(null);
      setIsOpen(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!active) return;
    window.location.href = NotesAPI.downloadUrl(active.id);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo" />
          <div>
            <div className="brandTitle">Vivid Notes</div>
            <div className="brandSub">Create colorful notes with images — save or download anytime</div>
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="panelHeader">
            <div className="panelTitle">Your notes</div>
            <button className="btn btnPrimary" onClick={newNote}>
              <Plus size={18} /> New
            </button>
          </div>

          {error ? <div className="error">{error}</div> : null}

          <div className="notesGrid">
            {notes.map((n) => (
              <button key={n.id} className="noteCard" onClick={() => openNote(n.id)}>
                <div className="noteTitle">{n.title}</div>
                <div className="noteMeta">
                  Updated {new Date(n.updated_at).toLocaleString()}
                </div>
              </button>
            ))}
            {!notes.length ? (
              <div className="empty">
                No notes yet. Click <b>New</b> to create your first one.
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <button className="fab" onClick={newNote} aria-label="Create note">
        <Plus />
      </button>

      {/* Modal editor */}
      <div className={`modalOverlay ${isOpen ? "open" : ""}`} onMouseDown={() => setIsOpen(false)}>
        <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
          <div className="modalHeader">
            <input
              className="titleInput"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
            />
            <button className="iconBtn" onClick={() => setIsOpen(false)} aria-label="Close">
              <X />
            </button>
          </div>

          <div className="editorWrap">
            <ReactQuill
              theme="snow"
              value={editorHtml}
              onChange={setEditorHtml}
              modules={quillModules}
              placeholder="Write something…"
            />
          </div>

          <div className="modalFooter">
            <div className="left">
              {active ? (
                <button className="btn btnDanger" onClick={remove} disabled={busy}>
                  <Trash2 size={18} /> Delete
                </button>
              ) : (
                <div className="hint">Tip: add images from the toolbar 🖼️</div>
              )}
            </div>

            <div className="right">
              {active ? (
                <button className="btn" onClick={download} disabled={busy}>
                  <Download size={18} /> Download
                </button>
              ) : null}
              <button className="btn btnPrimary" onClick={save} disabled={busy}>
                <Save size={18} /> {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
