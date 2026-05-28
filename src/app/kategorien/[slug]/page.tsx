import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ModelBadge from "@/components/ModelBadge";
import CategorySubscribeButton from "@/components/CategorySubscribeButton";
import { formatRelativeDate, parseTags, truncate } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) return {};
  return { title: cat.name, description: cat.description || undefined };
}

export const dynamic = "force-dynamic";

export default async function KategoriePage({ params }: Props) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      prompts: {
        where: { published: true },
        include: {
          author: { select: { name: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!category) notFound();

  return (
    <div className="page-content">
      <div className="container">
        {/* Header */}
        <div
          style={{
            padding: "32px",
            background: `${category.color}12`,
            border: `1px solid ${category.color}30`,
            borderRadius: "var(--radius-lg)",
            marginBottom: "36px",
            borderLeft: `4px solid ${category.color}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <Link href="/kategorien" style={{ color: "var(--text-muted)" }}>Kategorien</Link>
            <span>›</span>
            <span style={{ color: category.color }}>{category.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "2.5rem" }}>{category.icon}</span>
              <div>
                <h1 style={{ fontSize: "1.8rem", fontWeight: "800" }}>{category.name}</h1>
                {category.description && (
                  <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>{category.description}</p>
                )}
                <span className="badge" style={{ background: `${category.color}20`, color: category.color, marginTop: "8px" }}>
                  {category.prompts.length} {category.prompts.length === 1 ? "Prompt" : "Prompts"}
                </span>
              </div>
            </div>
            <CategorySubscribeButton categorySlug={category.slug} />
          </div>
        </div>

        {/* Prompts */}
        {category.prompts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧪</div>
            <div className="empty-state-title">Noch keine Prompts in dieser Kategorie</div>
          </div>
        ) : (
          <div className="prompts-grid">
            {category.prompts.map((prompt, i) => {
              const tags = parseTags(prompt.tags);
              return (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.slug}`}
                  className="prompt-card animate-fade-in"
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
                    <span className="prompt-card-meta">
                      von <strong>{prompt.author.name}</strong>
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
      </div>
    </div>
  );
}
