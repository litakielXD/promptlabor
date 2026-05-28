import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kategorien",
};

export const dynamic = "force-dynamic";

export default async function KategorienPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { prompts: { where: { published: true } } } },
      prompts: {
        where: { published: true },
        take: 3,
        orderBy: { createdAt: "desc" },
        select: { title: true, slug: true, model: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="page-content">
      <div className="container">
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "8px" }}>Kategorien</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {categories.length} thematische Bereiche mit insgesamt{" "}
            {categories.reduce((sum, c) => sum + c._count.prompts, 0)} Prompts
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="card"
              style={{ padding: "24px", borderLeft: `4px solid ${cat.color}` }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "1.8rem" }}>{cat.icon}</span>
                  <div>
                    <Link
                      href={`/kategorien/${cat.slug}`}
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "700",
                        color: "var(--text-primary)",
                        textDecoration: "none",
                      }}
                      className="nav-link"
                    >
                      {cat.name}
                    </Link>
                    {cat.description && (
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.87rem", marginTop: "4px" }}>
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span
                    className="badge"
                    style={{ background: `${cat.color}20`, color: cat.color }}
                  >
                    {cat._count.prompts} {cat._count.prompts === 1 ? "Prompt" : "Prompts"}
                  </span>
                  <Link href={`/kategorien/${cat.slug}`} className="btn btn-ghost btn-sm">
                    Alle ansehen →
                  </Link>
                </div>
              </div>

              {cat.prompts.length > 0 && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {cat.prompts.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/prompts/${p.slug}`}
                      style={{
                        padding: "6px 12px",
                        background: "var(--bg-input)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.82rem",
                        color: "var(--text-secondary)",
                        transition: "all 0.15s",
                      }}
                    >
                      {p.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
