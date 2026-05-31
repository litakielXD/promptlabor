import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://mondschule.de/promptlabor";

  // Statische Seiten
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/prompts`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/kategorien`, changeFrequency: "weekly", priority: 0.7 },
  ];

  // Dynamische Prompt-Seiten
  const prompts = await prisma.prompt.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });

  const promptPages: MetadataRoute.Sitemap = prompts.map((p) => ({
    url: `${base}/prompts/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Kategorien
  const categories = await prisma.category.findMany({
    select: { slug: true, createdAt: true },
  });

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/kategorien/${c.slug}`,
    lastModified: c.createdAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...promptPages, ...categoryPages];
}
