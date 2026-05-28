"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ModelBadge from "@/components/ModelBadge";
import { apiPath, formatDate, formatRelativeDate, parseTags } from "@/lib/utils";
import { isAdminSession, isApprovedSession } from "@/lib/session";

function highlightPlaceholders(text: string) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) =>
    /^\[.+\]$/.test(part)
      ? <span key={i} className="prompt-placeholder">{part}</span>
      : part
  );
}

function PromptMarkdown({ content }: { content: string }) {
  return (
    <div className="prompt-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            return <p>{processChildren(children)}</p>;
          },
          li({ children }) {
            return <li>{processChildren(children)}</li>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function processChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === "string") return highlightPlaceholders(children);
  if (Array.isArray(children)) return children.map((c, i) =>
    typeof c === "string" ? <span key={i}>{highlightPlaceholders(c)}</span> : c
  );
  return children;
}

interface Prompt {
  id: string;
  title: string;
  slug: string;
  content: string;
  description?: string;
  model: string;
  outputImageUrl?: string;
  outputLink?: string;
  outputCaption?: string;
  tags: string;
  createdAt: string;
  author: { name: string };
  category: { name: string; color: string; icon: string; slug: string };
  comments: Comment[];
}

interface Comment {
  id: string;
  content: string;
  isSuccessStory: boolean;
  createdAt: string;
  author: { name: string; id: string };
}

export default function PromptDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  const [comment, setComment] = useState("");
  const [isSuccessStory, setIsSuccessStory] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(apiPath(`/prompts/${slug}`))
      .then((r) => {
        if (r.status === 404) { setNotFoundError(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setPrompt(data);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (session) {
      fetch(apiPath(`/prompts/${slug}/subscribe`))
        .then((r) => r.json())
        .then((data) => setSubscribed(data.subscribed));
    }
  }, [slug, session]);

  async function toggleSubscribe() {
    if (!session) return;
    setSubLoading(true);
    const res = await fetch(apiPath(`/prompts/${slug}/subscribe`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: subscribed ? "unsubscribe" : "subscribe" }),
    });
    const data = await res.json();
    setSubscribed(data.subscribed);
    setSubLoading(false);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    setCommentError("");
    setCommentLoading(true);
    const res = await fetch(apiPath(`/prompts/${slug}/comments`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment, isSuccessStory }),
    });
    const data = await res.json();
    if (data.success) {
      setPrompt((prev) =>
        prev ? { ...prev, comments: [data.comment, ...prev.comments] } : prev
      );
      setComment("");
      setIsSuccessStory(false);
    } else {
      setCommentError(data.error || "Fehler beim Absenden.");
    }
    setCommentLoading(false);
  }

  async function copyPrompt() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="page-content" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (notFoundError || !prompt) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">Prompt nicht gefunden</div>
            <Link href="/prompts" className="btn btn-secondary" style={{ marginTop: "16px" }}>
              Zur Übersicht
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tags = parseTags(prompt.tags);
  const isAdmin = isAdminSession(session);
  const isApprovedMember = isApprovedSession(session);

  return (
    <div className="page-content">
      <div className="container">
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "24px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <Link href="/" style={{ color: "var(--text-muted)" }}>Startseite</Link>
            <span>›</span>
            <Link href="/prompts" style={{ color: "var(--text-muted)" }}>Prompts</Link>
            <span>›</span>
            <Link href={`/kategorien/${prompt.category.slug}`} style={{ color: prompt.category.color }}>
              {prompt.category.icon} {prompt.category.name}
            </Link>
          </div>

          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.8rem", fontWeight: "800", flex: 1, lineHeight: "1.3" }}>
                {prompt.title}
              </h1>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                <ModelBadge model={prompt.model} />
                {session && (
                  <button
                    onClick={toggleSubscribe}
                    disabled={subLoading}
                    className={`btn btn-sm ${subscribed ? "btn-secondary" : "btn-ghost"}`}
                    title={subscribed ? "Abonnement kündigen" : "Benachrichtigungen aktivieren"}
                  >
                    {subscribed ? "🔔 Abonniert" : "🔕 Abonnieren"}
                  </button>
                )}
                {isAdmin && (
                  <Link href={`/admin/prompts/${prompt.slug}/bearbeiten`} className="btn btn-ghost btn-sm">
                    ✏️ Bearbeiten
                  </Link>
                )}
              </div>
            </div>

            {prompt.description && (
              <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: "1.7", marginBottom: "16px" }}>
                {prompt.description}
              </p>
            )}

            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", color: "var(--text-muted)", fontSize: "0.83rem" }}>
              <span>von <strong style={{ color: "var(--text-secondary)" }}>{prompt.author.name}</strong></span>
              <span>·</span>
              <span>{formatDate(prompt.createdAt)}</span>
              <span>·</span>
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
            </div>

            {tags.length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
                {tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Prompt-Inhalt */}
          <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                📋 Prompt
              </h2>
              <button onClick={copyPrompt} className="btn btn-ghost btn-sm">
                {copied ? "✓ Kopiert!" : "📋 Kopieren"}
              </button>
            </div>
            <PromptMarkdown content={prompt.content} />
          </div>

          {/* Output-Beispiel */}
          {(prompt.outputImageUrl || prompt.outputLink) && (
            <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "16px" }}>
                💡 Beispiel-Output
              </h2>
              {prompt.outputCaption && (
                <p style={{ color: "var(--text-secondary)", marginBottom: "16px", fontSize: "0.9rem" }}>
                  {prompt.outputCaption}
                </p>
              )}
              {prompt.outputImageUrl && (
                <img
                  src={prompt.outputImageUrl}
                  alt="Beispiel-Output"
                  style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: "12px" }}
                />
              )}
              {prompt.outputLink && (
                <a
                  href={prompt.outputLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  🔗 Ergebnis ansehen →
                </a>
              )}
            </div>
          )}

          <hr className="divider" />

          {/* Kommentare */}
          <section id="kommentare">
            <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "24px" }}>
              💬 Kommentare & Erfahrungen ({prompt.comments.length})
            </h2>

            {/* Kommentarformular */}
            {isApprovedMember ? (
              <form onSubmit={submitComment} style={{ marginBottom: "32px" }}>
                <div className="card" style={{ padding: "20px" }}>
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <textarea
                      className="form-textarea"
                      placeholder="Teile deine Erfahrungen, Anpassungen oder Tipps zu diesem Prompt..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <label className="toggle-wrapper" style={{ cursor: "pointer", userSelect: "none" }}>
                      <span className="toggle">
                        <input
                          type="checkbox"
                          checked={isSuccessStory}
                          onChange={(e) => setIsSuccessStory(e.target.checked)}
                        />
                        <span className="toggle-track" />
                        <span className="toggle-thumb" />
                      </span>
                      <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                        🏆 Als Erfolgserlebnis markieren
                      </span>
                    </label>

                    <button type="submit" className="btn btn-primary" disabled={commentLoading || !comment.trim()}>
                      {commentLoading ? <span className="spinner" /> : "Kommentar senden"}
                    </button>
                  </div>

                  {commentError && (
                    <div className="alert alert-error" style={{ marginTop: "12px" }}>
                      {commentError}
                    </div>
                  )}
                </div>
              </form>
            ) : !session ? (
              <div className="alert alert-info" style={{ marginBottom: "24px" }}>
                <span>💬</span>
                <span>
                  <Link href="/login" style={{ color: "var(--accent-purple-light)", fontWeight: "600" }}>Melde dich an</Link> um zu kommentieren.
                </span>
              </div>
            ) : (
              <div className="alert alert-info" style={{ marginBottom: "24px" }}>
                <span>⏳</span>
                <span>Dein Konto wartet noch auf Freischaltung.</span>
              </div>
            )}

            {/* Kommentarliste */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {prompt.comments.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 0" }}>
                  <div className="empty-state-icon">💬</div>
                  <div className="empty-state-title">Noch keine Kommentare</div>
                  <p>Sei der/die Erste und teile deine Erfahrung!</p>
                </div>
              ) : (
                prompt.comments.map((c) => (
                  <div key={c.id} className={`comment ${c.isSuccessStory ? "success-story" : ""}`}>
                    <div className="comment-avatar">
                      {c.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="comment-body">
                      <div className="comment-header">
                        <span className="comment-author">{c.author.name}</span>
                        {c.isSuccessStory && (
                          <span className="success-badge">🏆 Erfolgserlebnis</span>
                        )}
                        <span className="comment-date">{formatRelativeDate(c.createdAt)}</span>
                      </div>
                      <p className="comment-content">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
