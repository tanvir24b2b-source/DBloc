import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories } from "../../hooks/useBlocs.js";
import api from "../../lib/api.js";

function resizeToSquare(file, size = 128) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const s = Math.min(img.width, img.height);
      const ox = (img.width - s) / 2;
      const oy = (img.height - s) / 2;
      ctx.drawImage(img, ox, oy, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = url;
  });
}

export default function ManageCategories() {
  const qc = useQueryClient();
  const { data: cats = [] } = useCategories();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const fileRef = useRef();
  const editFileRef = useRef();

  async function pickIcon(e, setter) {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await resizeToSquare(file, 128);
    setter(b64);
  }

  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await api.post("/categories", { name, image: icon });
    setName("");
    setIcon("");
    if (fileRef.current) fileRef.current.value = "";
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  async function remove(id) {
    if (!confirm("Delete this category?")) return;
    await api.delete(`/categories/${id}`);
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  function startEdit(c) {
    setEditId(c._id);
    setEditName(c.name);
    setEditIcon(c.image || "");
  }

  async function saveEdit(e) {
    e.preventDefault();
    await api.put(`/categories/${editId}`, { name: editName, image: editIcon });
    setEditId(null);
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Categories</h1>

      {/* Add form */}
      <div className="mt-6 max-w-lg rounded-xl border border-line bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Add New Category</h2>
        <form onSubmit={add} className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="rounded-lg border border-line px-4 py-2 text-sm"
            required
          />
          <div className="flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-lg border border-line bg-gray-100 overflow-hidden flex items-center justify-center cursor-pointer shrink-0"
              onClick={() => fileRef.current?.click()}
            >
              {icon ? (
                <img src={icon} className="w-full h-full object-cover" alt="icon preview" />
              ) : (
                <span className="text-xs text-muted text-center leading-tight px-1">Upload icon</span>
              )}
            </div>
            <div className="flex-1 text-xs text-muted">
              Icon must be square (1:1). Will be auto-cropped to 128×128px.
              <button type="button" onClick={() => fileRef.current?.click()} className="mt-1 block text-brand font-semibold hover:underline">
                Choose file
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickIcon(e, setIcon)} />
          </div>
          <button className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white self-start">
            Add Category
          </button>
        </form>
      </div>

      {/* Category list */}
      <div className="mt-8 max-w-2xl">
        <h2 className="mb-3 text-sm font-semibold text-ink">All Categories</h2>
        <div className="flex flex-col gap-3">
          {cats.map((c) =>
            editId === c._id ? (
              <form key={c._id} onSubmit={saveEdit} className="flex items-center gap-3 rounded-xl border border-brand bg-orange-50 px-4 py-3">
                <div
                  className="h-12 w-12 rounded-lg border border-line bg-gray-100 overflow-hidden flex items-center justify-center cursor-pointer shrink-0"
                  onClick={() => editFileRef.current?.click()}
                >
                  {editIcon ? (
                    <img src={editIcon} className="w-full h-full object-cover" alt="icon" />
                  ) : (
                    <span className="text-[10px] text-muted text-center">icon</span>
                  )}
                </div>
                <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickIcon(e, setEditIcon)} />
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded-lg border border-line px-3 py-1.5 text-sm"
                  required
                />
                <button type="submit" className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white">Save</button>
                <button type="button" onClick={() => setEditId(null)} className="text-xs text-muted hover:underline">Cancel</button>
              </form>
            ) : (
              <div key={c._id} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
                <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                  {c.image ? (
                    <img src={c.image} className="w-full h-full object-cover" alt={c.name} />
                  ) : (
                    <span className="text-xl">📦</span>
                  )}
                </div>
                <span className="flex-1 text-sm font-semibold text-ink">{c.name}</span>
                <button onClick={() => startEdit(c)} className="text-xs text-brand hover:underline">Edit</button>
                <button onClick={() => remove(c._id)} className="text-xs text-danger hover:underline">Delete</button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
