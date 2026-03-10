export type NoteListItem = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
};

export type Note = NoteListItem & {
  content_html: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const NotesAPI = {
  list: () => api<NoteListItem[]>("/api/notes"),
  get: (id: number) => api<Note>(`/api/notes/${id}`),
  create: (title: string, content_html: string) =>
    api<Note>("/api/notes", { method: "POST", body: JSON.stringify({ title, content_html }) }),
  update: (id: number, title: string, content_html: string) =>
    api<Note>(`/api/notes/${id}`, { method: "PUT", body: JSON.stringify({ title, content_html }) }),
  remove: (id: number) => fetch(`/api/notes/${id}`, { method: "DELETE" }),
  downloadUrl: (id: number) => `/api/notes/${id}/download`,
};
