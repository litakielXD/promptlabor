import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function uniquePromptSlug(title: string, excludeId?: string) {
  return uniqueSlug(title, async (slug) => {
    const existing = await prisma.prompt.findUnique({
      where: { slug },
      select: { id: true },
    });
    return !existing || existing.id === excludeId;
  });
}

export async function uniqueCategorySlug(name: string, excludeId?: string) {
  return uniqueSlug(name, async (slug) => {
    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    return !existing || existing.id === excludeId;
  });
}

async function uniqueSlug(value: string, isAvailable: (slug: string) => Promise<boolean>) {
  const base = slugify(value) || "eintrag";
  let candidate = base;
  let counter = 2;

  while (!(await isAvailable(candidate))) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

