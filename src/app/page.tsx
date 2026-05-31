import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ModelBadge from "@/components/ModelBadge";
import { appPath, formatRelativeDate, parseTags, truncate } from "@/lib/utils";
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
  const taskLinks = [
    {
      title: "Material erstellen",
      description: "Arbeitsblätter, Lernpfade, Quiz",
      href: "/prompts?search=Arbeitsblatt",
      accent: "var(--accent-blue)",
      icon: "📄",
    },
    {
      title: "Feedback geben",
      description: "Rückmeldungen und Korrektur",
      href: "/prompts?search=Feedback",
      accent: "var(--accent-green)",
      icon: "✍️",
    },
    {
      title: "Präsentieren",
      description: "Folien, Karten, NotebookLM",
      href: "/prompts?search=Präsentation",
      accent: "var(--accent-yellow)",
      icon: "▦",
    },
    {
      title: "Interaktiv bauen",
      description: "HTML-Tools und Lernspiele",
      href: "/prompts?search=HTML",
      accent: "var(--accent-purple-light)",
      icon: "⚡",
    },
  ];

  return (
    <div className="page-content">
      <div className="container">
        <section className="home-workbench">
          <div className="home-workbench-main">
            <div className="hero-label home-label">
              <span>🧪</span>
              <span>Promptlabor</span>
            </div>
            <h1 className="home-title">Prompts für Schule, die direkt weiterhelfen.</h1>
            <p className="home-subtitle">
              Finde Vorlagen für Unterricht, Feedback, Materialerstellung und Lernpfade –
              gesammelt für den praktischen Einsatz.
            </p>

            <form action={appPath("/prompts")} className="home-search">
              <input
                name="search"
                type="search"
                className="form-input home-search-input"
                placeholder="Prompt suchen, z.B. Kahoot, Deutschkorrektur, Lernpfad..."
              />
              <button className="btn btn-primary btn-lg" type="submit">
                Suchen →
              </button>
            </form>

            <div className="home-actions-row">
              <Link href="/prompts" className="btn btn-secondary">
                Alle Prompts
              </Link>
              <Link href="/kategorien" className="btn btn-ghost">
                Kategorien ansehen
              </Link>
              <Link href="/registrieren" className="btn btn-ghost">
                Mitmachen
              </Link>
            </div>
          </div>

          <aside className="home-status-panel">
            <div className="home-status-label">Sammlung</div>
            <div className="home-status-grid">
              <div>
                <strong>{totalCount}</strong>
                <span>Prompts</span>
              </div>
              <div>
                <strong>{categories.length}</strong>
                <span>Kategorien</span>
              </div>
            </div>
            <div className="home-status-note">
              Die meisten Prompts sind allround formuliert und funktionieren mit ChatGPT, Claude und Gemini.
            </div>
            <Link href="/prompts?model=NOTEBOOKLM" className="home-status-link">
              NotebookLM-Prompts ansehen →
            </Link>
          </aside>
        </section>

        <section style={{ marginBottom: "56px" }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">Schnell starten</h2>
              <p className="section-subtitle">Typische Aufgaben direkt öffnen</p>
            </div>
          </div>
          <div className="task-grid">
            {taskLinks.map((task) => (
              <Link key={task.title} href={task.href} className="task-card" style={{ borderTopColor: task.accent }}>
                <span className="task-icon" style={{ color: task.accent }}>{task.icon}</span>
                <strong>{task.title}</strong>
                <span>{task.description}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Neueste Prompts */}
        <section style={{ marginBottom: "60px" }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">Neu im Labor</h2>
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
      </div>
    </div>
  );
}
