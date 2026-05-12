"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

// Photo CRUD dashboard. Replaces editing the old Google Sheet by hand.
//
// Auth model: a shared secret stored as a Convex env var (ADMIN_SECRET). The
// operator types it once; it's kept in localStorage and sent with every write.
// Reads are public (the site is public anyway). This is deliberately lightweight
// — if this ever needs real multi-user auth, swap in Convex Auth here.

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const SECRET_KEY = "rkpai_admin_secret";

type PhotoRow = {
  _id: Id<"photos">;
  slug: string;
  alt: string;
  width: number;
  height: number;
  story: string;
  imageUrl: string | null;
  imageType: string;
  location?: string;
  createdAt: string;
  order: number;
};

function imageTypeFromFile(file: File): string {
  const fromMime = file.type.split("/")[1];
  if (fromMime) return fromMime.toLowerCase();
  const ext = file.name.split(".").pop();
  return (ext || "jpeg").toLowerCase();
}

function readImageMeta(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth || 0, height: img.naturalHeight || 0 });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export default function AdminPage() {
  const [secret, setSecret] = useState<string | null>(null);
  const [secretInput, setSecretInput] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(SECRET_KEY);
    if (stored) setSecret(stored);
  }, []);

  const isValid = useQuery(api.photos.verifyAdmin, secret ? { adminSecret: secret } : "skip");
  const photos = useQuery(api.photos.list, {}) as PhotoRow[] | undefined;

  // Bad/stale secret → clear it.
  useEffect(() => {
    if (secret && isValid === false) {
      localStorage.removeItem(SECRET_KEY);
      setSecret(null);
      setSecretInput("");
    }
  }, [secret, isValid]);

  if (!secret || isValid !== true) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-200 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = secretInput.trim();
            if (!v) return;
            localStorage.setItem(SECRET_KEY, v);
            setSecret(v);
          }}
          className="w-full max-w-sm bg-white border border-stone-300 rounded-2xl p-6 shadow-sm space-y-4"
        >
          <h1 className="text-xl font-semibold text-stone-900">Photo admin</h1>
          <p className="text-sm text-stone-600">
            Enter the admin secret (the <code>ADMIN_SECRET</code> set on the Convex deployment).
          </p>
          <input
            type="password"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder="Admin secret"
            className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-stone-50 outline-none focus:border-stone-500"
            autoFocus
          />
          {secret && isValid === false && (
            <p className="text-sm text-red-600">That secret was rejected.</p>
          )}
          <button
            type="submit"
            className="w-full h-11 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800"
          >
            Unlock
          </button>
        </form>
      </main>
    );
  }

  return <Dashboard secret={secret} photos={photos} onSignOut={() => {
    localStorage.removeItem(SECRET_KEY);
    setSecret(null);
  }} />;
}

function Dashboard({
  secret,
  photos,
  onSignOut,
}: {
  secret: string;
  photos: PhotoRow[] | undefined;
  onSignOut: () => void;
}) {
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const createPhoto = useMutation(api.photos.create);
  const updatePhoto = useMutation(api.photos.update);
  const removePhoto = useMutation(api.photos.remove);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<Id<"photos"> | null>(null);

  async function uploadFile(file: File): Promise<Id<"_storage">> {
    const uploadUrl = await generateUploadUrl({ adminSecret: secret });
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const { storageId } = await res.json();
    return storageId as Id<"_storage">;
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = (data.get("file") as File) || null;
    if (!file || file.size === 0) {
      setError("Pick an image file.");
      return;
    }
    setBusy(true);
    try {
      const meta = await readImageMeta(file);
      const imageId = await uploadFile(file);
      await createPhoto({
        adminSecret: secret,
        slug: String(data.get("slug") || "").trim(),
        alt: String(data.get("alt") || "").trim(),
        story: String(data.get("story") || "").trim(),
        location: String(data.get("location") || "").trim() || undefined,
        createdAt: String(data.get("createdAt") || "").trim() || undefined,
        width: Number(data.get("width")) || meta.width || 300,
        height: Number(data.get("height")) || meta.height || 200,
        imageType: imageTypeFromFile(file),
        imageId,
      });
      form.reset();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(p: PhotoRow, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      const file = (data.get("file") as File) || null;
      let imageId: Id<"_storage"> | undefined;
      let imageType: string | undefined;
      let width = Number(data.get("width")) || p.width;
      let height = Number(data.get("height")) || p.height;
      if (file && file.size > 0) {
        const meta = await readImageMeta(file);
        imageId = await uploadFile(file);
        imageType = imageTypeFromFile(file);
        if (!data.get("width")) width = meta.width || p.width;
        if (!data.get("height")) height = meta.height || p.height;
      }
      await updatePhoto({
        adminSecret: secret,
        id: p._id,
        slug: String(data.get("slug") || "").trim() || undefined,
        alt: String(data.get("alt") || "").trim() || undefined,
        story: String(data.get("story") ?? "").trim(),
        location: String(data.get("location") || "").trim() || undefined,
        createdAt: String(data.get("createdAt") || "").trim() || undefined,
        order: data.get("order") !== "" ? Number(data.get("order")) : undefined,
        width,
        height,
        imageId,
        imageType,
      });
      setEditingId(null);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(p: PhotoRow) {
    if (!confirm(`Delete "${p.alt || p.slug}"? This also deletes the image file.`)) return;
    setBusy(true);
    setError(null);
    try {
      await removePhoto({ adminSecret: secret, id: p._id });
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full h-10 px-3 rounded-lg border border-stone-300 bg-white outline-none focus:border-stone-500 text-sm";
  const labelCls = "text-xs font-medium text-stone-500 uppercase tracking-wide";

  return (
    <main className="min-h-screen bg-stone-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-stone-900">Photos</h1>
          <button onClick={onSignOut} className="text-sm text-stone-600 underline hover:text-stone-900">
            Sign out
          </button>
        </header>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Add new */}
        <section className="bg-white border border-stone-300 rounded-2xl p-5 md:p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Add a photo</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className={labelCls}>Image file</label>
              <input type="file" name="file" accept="image/*" required className="block text-sm" />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Slug (URL id)</label>
              <input name="slug" required placeholder="e.g. great-hornbill" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Alt / title</label>
              <input name="alt" required placeholder="Great Hornbill in flight" className={inputCls} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className={labelCls}>Story</label>
              <textarea name="story" rows={3} className={inputCls + " h-auto py-2"} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Location (optional)</label>
              <input name="location" placeholder="Western Ghats, India" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Created at (ISO, optional)</label>
              <input name="createdAt" placeholder="2026-05-12T00:00:00.000Z" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Width (auto if blank)</label>
              <input name="width" type="number" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Height (auto if blank)</label>
              <input name="height" type="number" className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="h-10 px-5 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50"
              >
                {busy ? "Working…" : "Add photo"}
              </button>
            </div>
          </form>
        </section>

        {/* List */}
        <section className="space-y-3">
          {photos === undefined && <p className="text-stone-500">Loading…</p>}
          {photos && photos.length === 0 && (
            <p className="text-stone-500">No photos yet — add one above, or run the import script.</p>
          )}
          {photos?.map((p) => (
            <div key={p._id} className="bg-white border border-stone-300 rounded-2xl p-4">
              {editingId === p._id ? (
                <form onSubmit={(e) => handleUpdate(p, e)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2 flex gap-4 items-start">
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="w-28 h-28 object-cover rounded-lg border border-stone-200" />
                    )}
                    <div className="space-y-1 flex-1">
                      <label className={labelCls}>Replace image (optional)</label>
                      <input type="file" name="file" accept="image/*" className="block text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Slug</label>
                    <input name="slug" defaultValue={p.slug} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Alt / title</label>
                    <input name="alt" defaultValue={p.alt} className={inputCls} />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className={labelCls}>Story</label>
                    <textarea name="story" rows={3} defaultValue={p.story} className={inputCls + " h-auto py-2"} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Location</label>
                    <input name="location" defaultValue={p.location ?? ""} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Created at</label>
                    <input name="createdAt" defaultValue={p.createdAt} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Width</label>
                    <input name="width" type="number" defaultValue={p.width} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Height</label>
                    <input name="height" type="number" defaultValue={p.height} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Order</label>
                    <input name="order" type="number" defaultValue={p.order} className={inputCls} />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="h-10 px-5 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50"
                    >
                      {busy ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="h-10 px-5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex gap-4 items-center">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="w-20 h-20 object-cover rounded-lg border border-stone-200 shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-stone-100 border border-stone-200 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900 truncate">{p.alt || "(no title)"}</p>
                    <p className="text-sm text-stone-500 truncate">
                      /stories/{p.slug} · {p.width}×{p.height} · order {p.order}
                      {p.location ? ` · ${p.location}` : ""}
                    </p>
                    {p.story && <p className="text-sm text-stone-600 truncate mt-1">{p.story}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditingId(p._id)}
                      className="h-9 px-4 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={busy}
                      className="h-9 px-4 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-sm disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
