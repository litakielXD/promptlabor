"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import ModelBadge from "@/components/ModelBadge";
import { isAdminSession } from "@/lib/session";
import { apiPath } from "@/lib/utils";

const MODELS = ["ALLROUND", "NOTEBOOKLM"];

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Prompt {
  slug: string;
  title: string;
  content: string;
  description: string;
  model: string;
  categoryId: string;
  outputLink: string;
  outputCaption: string;
  outputImageUrl: string;
  tags: string;
  published: boolean;
}

export default function EditPromptPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("ALLROUND");
  const [categoryId, setCategoryId] = useState("");
  const [outputLink, setOutputLink] = useState("");
  const [outputCaption, setOutputCaption] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [published, setPublished] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  const isAdmin = isAdminSession(session);

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !isAdmin)) {
      router.push("/");
    }
  }, [status, isAdmin, router]);

  useEffect(() => {
    Promise.all([
      fetch(apiPath("/categories")).then((r) => r.json()),
      fetch(apiPath(`/prompts/${slug}`)).then((r) => r.json()),
    ]).then(([cats, prompt]: [Category[], Prompt]) => {
      setCategories(cats);
      setTitle(prompt.title);
      setContent(prompt.content);
      setDescription(prompt.description || "");
      setModel(prompt.model);
      setCategoryId(prompt.categoryId);
      setOutputLink(prompt.outputLink || "");
      setOutputCaption(prompt.outputCaption || "");
      setTagsRaw(JSON.parse(prompt.tags || "[]").join(", "));
      setPublished(prompt.published);
      setExistingImage(prompt.outputImageUrl || null);
      setDataLoading(false);
    });
  }, [slug]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("description", description);
    formData.append("model", model);
    formData.append("categoryId", categoryId);
    formData.append("outputLink", outputLink);
    formData.append("outputCaption", outputCaption);
    formData.append("tags", tagsRaw);
    formData.append("published", String(published));
    if (imageFile) formData.append("outputImage", imageFile);

    const res = await fetch(apiPath(`/prompts/${slug}`), {
      method: "PATCH",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      router.push(`/prompts/${data.prompt.slug}`);
    } else {
      setError(data.error || "Fehler beim Speichern.");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 5000);
      return;
    }
    const res = await fetch(apiPath(`/prompts/${slug}`), { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      router.push("/prompts");
    } else {
      setError(data.error || "Fehler beim Löschen.");
      setDeleteConfirm(false);
    }
  }

  if (dataLoading) {
    return (
      <div className="page-content" style={{ display: "flex", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "4px" }}>Prompt bearbeiten</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Änderungen werden sofort wirksam</p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-sm"
              style={{ borderColor: "rgba(239,68,68,0.3)", color: deleteConfirm ? "white" : "var(--accent-red)", background: deleteConfirm ? "var(--accent-red)" : "transparent", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              {deleteConfirm ? "⚠️ Nochmal klicken zum Bestätigen" : "🗑️ Löschen"}
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px" }}>Grundangaben</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-title">Titel *</label>
                  <input id="edit-title" type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-desc">Kurzbeschreibung</label>
                  <input id="edit-desc" type="text" className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Modellbindung</label>
                    <p className="form-hint">Meistens allround lassen. Nur wählen, wenn der Prompt ein bestimmtes Tool braucht.</p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {MODELS.map((m) => (
                        <button key={m} type="button" onClick={() => setModel(m)}
                          style={{ padding: "6px 4px", background: "transparent", border: "none", cursor: "pointer", opacity: model === m ? 1 : 0.4, transform: model === m ? "scale(1.05)" : "scale(1)", transition: "all 0.15s" }}>
                          {m === "ALLROUND" ? <span className="model-badge allround">◎ Allround</span> : <ModelBadge model={m} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-cat">Kategorie *</label>
                    <select id="edit-cat" className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-tags">Tags (kommagetrennt)</label>
                  <input id="edit-tags" type="text" className="form-input" value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px" }}>Prompt-Text *</h2>
              <textarea className="form-textarea" value={content} onChange={(e) => setContent(e.target.value)} rows={12} required
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.875rem" }} />
            </div>

            <div className="card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px" }}>
                💡 Beispiel-Output <span style={{ color: "var(--text-muted)", fontWeight: "400", fontSize: "0.85rem" }}>(optional)</span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {existingImage && !imagePreview && (
                  <div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "8px" }}>Aktuelles Bild:</p>
                    <img src={existingImage} alt="Aktuelles Bild" style={{ maxHeight: "160px", objectFit: "contain", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Neues Bild hochladen</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }} />
                  {imagePreview && <img src={imagePreview} alt="Vorschau" style={{ maxHeight: "200px", objectFit: "contain", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginTop: "8px" }} />}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-link">Link zum Ergebnis</label>
                  <input id="edit-link" type="url" className="form-input" placeholder="https://..." value={outputLink} onChange={(e) => setOutputLink(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-caption">Beschreibung des Outputs</label>
                  <input id="edit-caption" type="text" className="form-input" value={outputCaption} onChange={(e) => setOutputCaption(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "24px" }}>
              <label className="toggle-wrapper" style={{ cursor: "pointer" }}>
                <span className="toggle">
                  <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                  <span className="toggle-track" /><span className="toggle-thumb" />
                </span>
                <div>
                  <div style={{ fontWeight: "600" }}>Veröffentlicht</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Deaktivieren um als Entwurf zu verstecken</div>
                </div>
              </label>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => router.push(`/prompts/${slug}`)} className="btn btn-ghost">Abbrechen</button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? <span className="spinner" /> : "Änderungen speichern"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
