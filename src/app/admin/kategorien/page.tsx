"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAdminSession } from "@/lib/session";
import { apiPath } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  _count: { prompts: number };
}

const PRESET_COLORS = [
  "#6366f1", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4",
];

function CategoryForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<Category>;
  onSave: (data: { name: string; description: string; color: string; icon: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? "#6366f1");
  const [icon, setIcon] = useState(initial?.icon ?? "📁");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input
            type="text"
            className="form-input"
            placeholder="z.B. Unterrichtsplanung"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">Icon (Emoji)</label>
          <input
            type="text"
            className="form-input"
            placeholder="📁"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            style={{ fontSize: "1.3rem" }}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Beschreibung</label>
        <input
          type="text"
          className="form-input"
          placeholder="Kurze Beschreibung dieser Kategorie"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Farbe</label>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: c,
                border: color === c ? "3px solid var(--text-primary)" : "3px solid transparent",
                cursor: "pointer",
                outline: "none",
                flexShrink: 0,
              }}
              title={c}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: "28px", height: "28px", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
            title="Eigene Farbe"
          />
          <span
            className="category-badge"
            style={{
              color,
              borderColor: `${color}40`,
              background: `${color}15`,
              marginLeft: "8px",
            }}
          >
            {icon || "📁"} {name || "Vorschau"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">
          Abbrechen
        </button>
        <button
          type="button"
          onClick={() => onSave({ name, description, color, icon })}
          className="btn btn-primary btn-sm"
          disabled={saving || !name.trim()}
        >
          {saving ? <span className="spinner" /> : "Speichern"}
        </button>
      </div>
    </div>
  );
}

export default function KategorienAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = isAdminSession(session);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !isAdmin)) {
      router.push("/");
    }
  }, [status, isAdmin, router]);

  useEffect(() => {
    fetch(apiPath("/categories"))
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      });
  }, []);

  async function handleCreate(data: { name: string; description: string; color: string; icon: string }) {
    setError("");
    setSaving(true);
    const res = await fetch(apiPath("/categories"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) {
      setCategories((prev) => [...prev, { ...json.category, _count: { prompts: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
      setCreating(false);
    } else {
      setError(json.error || "Fehler beim Erstellen.");
    }
    setSaving(false);
  }

  async function handleUpdate(id: string, data: { name: string; description: string; color: string; icon: string }) {
    setError("");
    setSaving(true);
    const res = await fetch(apiPath(`/categories/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...json.category } : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    } else {
      setError(json.error || "Fehler beim Speichern.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Kategorie „${name}" wirklich löschen?`)) return;
    setError("");
    const res = await fetch(apiPath(`/categories/${id}`), { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } else {
      setError(json.error || "Fehler beim Löschen.");
    }
  }

  if (loading) {
    return (
      <div className="page-content" style={{ display: "flex", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <Link href="/admin" style={{ color: "var(--text-muted)" }}>Admin</Link>
                <span>›</span>
                <span>Kategorien</span>
              </div>
              <h1 style={{ fontSize: "1.8rem", fontWeight: "800" }}>Kategorien</h1>
              <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>{categories.length} Kategorien</p>
            </div>
            {!creating && (
              <button
                onClick={() => { setCreating(true); setEditingId(null); setError(""); }}
                className="btn btn-primary"
              >
                + Neue Kategorie
              </button>
            )}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: "20px" }}>{error}</div>
          )}

          {/* Neue Kategorie Formular */}
          {creating && (
            <div className="card" style={{ padding: "24px", marginBottom: "20px", borderLeft: "3px solid var(--accent-purple-light)" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "16px" }}>Neue Kategorie</h2>
              <CategoryForm
                onSave={handleCreate}
                onCancel={() => { setCreating(false); setError(""); }}
                saving={saving}
              />
            </div>
          )}

          {/* Kategorien-Liste */}
          {categories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <div className="empty-state-title">Noch keine Kategorien</div>
              <p>Erstelle die erste Kategorie über den Button oben.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {categories.map((cat) => (
                <div key={cat.id} className="card" style={{ padding: "0", overflow: "hidden" }}>
                  {/* Zeile */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "16px 20px",
                    borderLeft: `4px solid ${cat.color}`,
                  }}>
                    <div style={{ fontSize: "1.4rem", flexShrink: 0 }}>{cat.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: "600", marginBottom: "2px" }}>{cat.name}</div>
                      {cat.description && (
                        <div style={{ fontSize: "0.83rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {cat.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {cat._count.prompts} {cat._count.prompts === 1 ? "Prompt" : "Prompts"}
                      </span>
                      <button
                        onClick={() => { setEditingId(editingId === cat.id ? null : cat.id); setCreating(false); setError(""); }}
                        className="btn btn-ghost btn-sm"
                      >
                        {editingId === cat.id ? "Schließen" : "✏️ Bearbeiten"}
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="btn btn-danger btn-sm"
                        disabled={cat._count.prompts > 0}
                        title={cat._count.prompts > 0 ? "Kategorie enthält noch Prompts" : "Löschen"}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Inline-Editformular */}
                  {editingId === cat.id && (
                    <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                      <CategoryForm
                        initial={cat}
                        onSave={(data) => handleUpdate(cat.id, data)}
                        onCancel={() => { setEditingId(null); setError(""); }}
                        saving={saving}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
