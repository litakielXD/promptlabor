"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import ModelBadge from "@/components/ModelBadge";
import { apiPath, formatRelativeDate, parseTags, truncate } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PAGE_SIZE = 12;

const MODELS = [
  { key: "", label: "Alle Prompts" },
  { key: "ALLROUND", label: "Allround" },
  { key: "NOTEBOOKLM", label: "NotebookLM" },
];

function PromptsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const model = searchParams.get("model") || "";
  const category = searchParams.get("category") || "";
  const [page, setPage] = useState(1);

  // Filter-Änderungen setzen Seite zurück
  const queryParams = new URLSearchParams({
    ...(search && { search }),
    ...(model && { model }),
    ...(category && { category }),
    take: String(PAGE_SIZE * page),
  }).toString();

  const { data: result, isLoading } = useSWR(
    apiPath(`/prompts?${queryParams}`),
    fetcher,
    { refreshInterval: 30000 }
  );

  const prompts = result?.prompts ?? result ?? [];
  const totalCount = result?.total ?? prompts.length;
  const hasMore = prompts.length < totalCount;

  const { data: categories } = useSWR(apiPath("/categories"), fetcher);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    setPage(1); // Filter-Reset → erste Seite
    router.push(`/prompts?${params.toString()}`);
  }

  return (
    <div className="page-content">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "8px" }}>
            Alle Prompts
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {isLoading ? "Lade…" : `${totalCount} ${totalCount === 1 ? "Prompt" : "Prompts"}`}
          </p>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
          <input
            type="search"
            placeholder="🔍 Prompts durchsuchen..."
            className="form-input"
            style={{ maxWidth: "360px" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setParam("search", search);
            }}
          />

          <select
            className="form-select"
            style={{ maxWidth: "200px" }}
            value={model}
            onChange={(e) => setParam("model", e.target.value)}
          >
            {MODELS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ maxWidth: "220px" }}
            value={category}
            onChange={(e) => setParam("category", e.target.value)}
          >
            <option value="">Alle Kategorien</option>
            {categories?.map((c: { slug: string; name: string }) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>

          {(model || category || search) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch("");
                router.push("/prompts");
              }}
            >
              ✕ Filter zurücksetzen
            </button>
          )}
        </div>

        {/* Prompts */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <div className="spinner" />
          </div>
        ) : prompts?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">Keine Prompts gefunden</div>
            <p>Versuche andere Suchbegriffe oder Filter.</p>
          </div>
        ) : (
          <div className="prompts-grid">
            {prompts?.map((prompt: {
              id: string;
              slug: string;
              title: string;
              description?: string;
              model: string;
              tags: string;
              category: { name: string; color: string; icon: string; slug: string };
              _count: { comments: number };
              createdAt: string;
            }, i: number) => {
              const tags = parseTags(prompt.tags);
              return (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.slug}`}
                  className={`prompt-card animate-fade-in`}
                  style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
                >
                  <div className="prompt-card-header">
                    <h3 className="prompt-card-title">{prompt.title}</h3>
                    <ModelBadge model={prompt.model} />
                  </div>
                  {prompt.description && (
                    <p className="prompt-card-description">{truncate(prompt.description, 120)}</p>
                  )}
                  <div className="prompt-card-footer">
                    <span
                      className="category-badge"
                      style={{
                        color: prompt.category.color,
                        borderColor: `${prompt.category.color}40`,
                        background: `${prompt.category.color}15`,
                      }}
                    >
                      {prompt.category.icon} {prompt.category.name}
                    </span>
                    <span className="prompt-card-meta">💬 {prompt._count.comments}</span>
                    <span className="prompt-card-meta" style={{ marginLeft: "auto" }}>
                      {formatRelativeDate(prompt.createdAt)}
                    </span>
                  </div>
                  {tags.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
                      {tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Lade mehr */}
        {!isLoading && hasMore && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "32px" }}>
            <button
              className="btn btn-secondary"
              onClick={() => setPage((p) => p + 1)}
            >
              Weitere Prompts laden ({totalCount - prompts.length} mehr)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PromptsPage() {
  return (
    <Suspense fallback={<div className="page-content"><div className="container"><div className="spinner" /></div></div>}>
      <PromptsContent />
    </Suspense>
  );
}
