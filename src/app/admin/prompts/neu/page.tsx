"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ModelBadge from "@/components/ModelBadge";
import { isAdminSession } from "@/lib/session";
import { apiPath } from "@/lib/utils";

const MODELS = ["ALLROUND", "NOTEBOOKLM"];

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function NewPromptPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("ALLROUND");
  const [categoryId, setCategoryId] = useState("");
  const [outputLink, setOutputLink] = useState("");
  const [outputCaption, setOutputCaption] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isAdmin = isAdminSession(session);

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !isAdmin)) {
      router.push("/");
    }
  }, [status, isAdmin, router]);

  useEffect(() => {
    fetch(apiPath("/categories")).then((r) => r.json()).then(setCategories);
  }, []);

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
    formData.append("tags", tags);
    formData.append("published", String(published));
    if (imageFile) formData.append("outputImage", imageFile);

    const res = await fetch(apiPath("/prompts"), {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      router.push(`/prompts/${data.prompt.slug}`);
    } else {
      setError(data.error || "Fehler beim Erstellen.");
    }
    setLoading(false);
  }

  return (
    <div className="page-content">
      <div className="container">
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px" }}>
              Neuer Prompt
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>Erstelle einen neuen Prompt für die Bibliothek</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Titel */}
            <div className="card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px" }}>Grundangaben</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="prompt-title">Titel *</label>
                  <input
                    id="prompt-title"
                    type="text"
                    className="form-input"
                    placeholder="z.B. Differenzierte Lernziele formulieren"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prompt-desc">Kurzbeschreibung</label>
                  <input
                    id="prompt-desc"
                    type="text"
                    className="form-input"
                    placeholder="Wofür ist dieser Prompt? Wann nutzt man ihn?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Modellbindung</label>
                    <p className="form-hint">Meistens allround lassen. Nur wählen, wenn der Prompt ein bestimmtes Tool braucht.</p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {MODELS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setModel(m)}
                          style={{
                            padding: "6px 4px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            opacity: model === m ? 1 : 0.4,
                            transform: model === m ? "scale(1.05)" : "scale(1)",
                            transition: "all 0.15s",
                          }}
                        >
                          {m === "ALLROUND" ? <span className="model-badge allround">◎ Allround</span> : <ModelBadge model={m} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="prompt-category">Kategorie *</label>
                    <select
                      id="prompt-category"
                      className="form-select"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                    >
                      <option value="">Kategorie wählen...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prompt-tags">Tags (kommagetrennt)</label>
                  <input
                    id="prompt-tags"
                    type="text"
                    className="form-input"
                    placeholder="Lernziele, Differenzierung, Planung"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Prompt-Inhalt */}
            <div className="card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px" }}>Prompt-Text *</h2>
              <div className="form-group">
                <textarea
                  className="form-textarea"
                  placeholder="Der vollständige Prompt-Text. Verwende [PLATZHALTER] für variable Stellen..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  required
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.875rem" }}
                />
              </div>
            </div>

            {/* Output-Beispiel */}
            <div className="card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px" }}>
                💡 Beispiel-Output <span style={{ color: "var(--text-muted)", fontWeight: "400", fontSize: "0.85rem" }}>(optional)</span>
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Screenshot / Bild hochladen</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Vorschau"
                      style={{ maxHeight: "200px", objectFit: "contain", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginTop: "8px" }}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="output-link">Oder: Link zum Ergebnis</label>
                  <input
                    id="output-link"
                    type="url"
                    className="form-input"
                    placeholder="https://..."
                    value={outputLink}
                    onChange={(e) => setOutputLink(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="output-caption">Beschreibung des Outputs</label>
                  <input
                    id="output-caption"
                    type="text"
                    className="form-input"
                    placeholder="Was zeigt dieses Beispiel?"
                    value={outputCaption}
                    onChange={(e) => setOutputCaption(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Veröffentlichen */}
            <div className="card" style={{ padding: "24px" }}>
              <label className="toggle-wrapper" style={{ cursor: "pointer" }}>
                <span className="toggle">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                  />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </span>
                <div>
                  <div style={{ fontWeight: "600" }}>Sofort veröffentlichen</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    Deaktivieren um als Entwurf zu speichern
                  </div>
                </div>
              </label>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => router.back()} className="btn btn-ghost">
                Abbrechen
              </button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? <span className="spinner" /> : (published ? "Veröffentlichen" : "Entwurf speichern")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
