"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModelBadge from "@/components/ModelBadge";
import { apiPath, formatRelativeDate } from "@/lib/utils";
import { isAdminSession } from "@/lib/session";

interface Prompt {
  id: string;
  slug: string;
  title: string;
  model: string;
  published: boolean;
  createdAt: string;
  category: { name: string; icon: string; color: string };
  _count: { comments: number };
}

export default function AdminPromptsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = isAdminSession(session);

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !isAdmin)) {
      router.push("/");
    }
  }, [status, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch(apiPath("/prompts?admin=true"))
      .then((r) => r.json())
      .then((data) => {
        setPrompts(data);
        setLoading(false);
      });
  }, [isAdmin]);

  async function togglePublished(slug: string, currentlyPublished: boolean) {
    const formData = new FormData();
    formData.append("published", String(!currentlyPublished));
    const res = await fetch(apiPath(`/prompts/${slug}`), { method: "PATCH", body: formData });
    const data = await res.json();
    if (data.success) {
      setPrompts((prev) =>
        prev.map((p) => p.slug === slug ? { ...p, published: !currentlyPublished } : p)
      );
    }
  }

  async function deletePrompt(slug: string) {
    if (!confirm("Prompt wirklich löschen?")) return;
    const res = await fetch(apiPath(`/prompts/${slug}`), { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setPrompts((prev) => prev.filter((p) => p.slug !== slug));
    }
  }

  const published = prompts.filter((p) => p.published);
  const drafts = prompts.filter((p) => !p.published);

  return (
    <div className="page-content">
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "800" }}>Prompt-Verwaltung</h1>
            <p style={{ color: "var(--text-secondary)" }}>
              {published.length} veröffentlicht · {drafts.length} Entwürfe
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href="/admin" className="btn btn-ghost btn-sm">← Admin</Link>
            <Link href="/admin/prompts/neu" className="btn btn-primary btn-sm">+ Neuer Prompt</Link>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="card"
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  opacity: prompt.published ? 1 : 0.65,
                }}
              >
                {/* Status-Indikator */}
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: prompt.published ? "var(--accent-green)" : "var(--text-muted)",
                    flexShrink: 0,
                  }}
                  title={prompt.published ? "Veröffentlicht" : "Entwurf"}
                />

                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ fontWeight: "600", fontSize: "0.95rem", marginBottom: "4px" }}>
                    {prompt.title}
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <ModelBadge model={prompt.model} size="sm" />
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        background: `${prompt.category.color}15`,
                        color: prompt.category.color,
                        borderRadius: "var(--radius-full)",
                        border: `1px solid ${prompt.category.color}30`,
                      }}
                    >
                      {prompt.category.icon} {prompt.category.name}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                      💬 {prompt._count.comments}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                      {formatRelativeDate(prompt.createdAt)}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button
                    onClick={() => togglePublished(prompt.slug, prompt.published)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: "0.78rem" }}
                  >
                    {prompt.published ? "📴 Verbergen" : "📢 Veröffentlichen"}
                  </button>
                  <Link href={`/admin/prompts/${prompt.slug}/bearbeiten`} className="btn btn-ghost btn-sm">
                    ✏️ Bearbeiten
                  </Link>
                  <Link href={`/prompts/${prompt.slug}`} className="btn btn-ghost btn-sm">
                    👁️
                  </Link>
                  <button
                    onClick={() => deletePrompt(prompt.slug)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: "var(--accent-red)" }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {prompts.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🧪</div>
                <div className="empty-state-title">Noch keine Prompts vorhanden</div>
                <Link href="/admin/prompts/neu" className="btn btn-primary" style={{ marginTop: "16px" }}>
                  Ersten Prompt erstellen →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
