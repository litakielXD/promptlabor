import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ModelBadge from "@/components/ModelBadge";
import { formatRelativeDate, parseTags, truncate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promptlabor – Prompt-Bibliothek für Bildung",
  description: "Entdecke bewährte KI-Prompts für Schule und Unterrichtsentwicklung. Teile deine Erfahrungen und lerne von anderen Lehrkräften.",
};

export const dynamic = "force-dynamic";

async function getHomeData() {
  const [featuredPrompts, categories, totalCount] = await Promise.all([
    prisma.prompt.findMany({
      where: { published: true },
      include: {
        author: { select: { name: true } },
        category: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.category.findMany({
      include: { _count: { select: { prompts: { where: { published: true } } } } },
      orderBy: { name: "asc" },
    }),
    prisma.prompt.count({ where: { published: true } }),
  ]);

  return { featuredPrompts, categories, totalCount };
}

export default async function HomePage() {
  const { featuredPrompts, categories, totalCount } = await getHomeData();

  return (
    <div className="page-content">
      {/* Hero */}
      <section className="hero">
        <div className="hero-label">
          <span>🧪</span>
          <span>Prompt-Bibliothek für Bildung</span>
        </div>
        <h1 className="hero-title">
          Prompts entdecken,<br />
          teilen & verbessern
        </h1>
        <p className="hero-subtitle">
          Eine kuratierte Sammlung bewährter KI-Prompts für Schule und Unterrichtsentwicklung –
          mit Beispielen, Erfahrungen und Kommentaren aus der Praxis.
        </p>
        <div className="hero-actions">
          <Link href="/prompts" className="btn btn-primary btn-lg">
            Alle Prompts ansehen →
          </Link>
          <Link href="/registrieren" className="btn btn-secondary btn-lg">
            Mitmachen
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "32px", justifyContent: "center", marginTop: "40px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--accent-purple-light)" }}>{totalCount}</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Prompts</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--accent-blue)" }}>{categories.length}</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Kategorien</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--accent-green)" }}>4</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>KI-Modelle</div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Kategorien */}
        {categories.length > 0 && (
          <section style={{ marginBottom: "60px" }}>
            <div className="section-header">
              <div>
                <h2 className="section-title">Kategorien</h2>
                <p className="section-subtitle">Thematisch organisierte Prompt-Sammlungen</p>
              </div>
              <Link href="/kategorien" className="btn btn-ghost btn-sm">Alle ansehen →</Link>
            </div>
            <div className="categories-grid">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/kategorien/${cat.slug}`}>
                  <div
                    className="category-card"
                    style={{ borderLeft: `3px solid ${cat.color}` }}
                  >
                    <div className="category-card-icon">{cat.icon}</div>
                    <div>
                      <div className="category-card-name">{cat.name}</div>
                      <div className="category-card-count">
                        {cat._count.prompts} {cat._count.prompts === 1 ? "Prompt" : "Prompts"}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Neueste Prompts */}
        <section>
          <div className="section-header">
            <div>
              <h2 className="section-title">Neueste Prompts</h2>
              <p className="section-subtitle">Frisch hinzugefügt und direkt ausprobierbar</p>
            </div>
            {totalCount > 6 && (
              <Link href="/prompts" className="btn btn-ghost btn-sm">
                Alle {totalCount} Prompts →
              </Link>
            )}
          </div>

          {featuredPrompts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧪</div>
              <div className="empty-state-title">Noch keine Prompts vorhanden</div>
              <p>Die ersten Prompts werden bald hinzugefügt.</p>
            </div>
          ) : (
            <div className="prompts-grid">
              {featuredPrompts.map((prompt, i) => {
                const tags = parseTags(prompt.tags);
                return (
                  <Link
                    key={prompt.id}
                    href={`/prompts/${prompt.slug}`}
                    className={`prompt-card animate-fade-in delay-${Math.min(i + 1, 3)}`}
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
                      <span className="prompt-card-meta">
                        💬 {prompt._count.comments}
                      </span>
                      <span className="prompt-card-meta" style={{ marginLeft: "auto" }}>
                        {formatRelativeDate(prompt.createdAt)}
                      </span>
                    </div>
                    {tags.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
                        {tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Modellnutzung Info */}
        <section style={{ marginTop: "60px" }}>
          <div className="card" style={{ padding: "32px" }}>
            <h2 style={{ marginBottom: "8px", fontSize: "1.2rem", fontWeight: "700" }}>
              Modellunabhängig nutzbar
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "0.9rem" }}>
              Die meisten Prompts sind bewusst modellunabhängig formuliert und funktionieren gut mit ChatGPT, Claude und Gemini. Eine Kennzeichnung erscheint nur, wenn ein Prompt wirklich an ein bestimmtes Tool gebunden ist.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <ModelBadge model="NOTEBOOKLM" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
