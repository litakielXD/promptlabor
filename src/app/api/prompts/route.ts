import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { sendMail, emailTemplates } from "@/lib/mail";
import { isAdminSession } from "@/lib/session";
import { safeImageFilename, validateImageFile } from "@/lib/upload";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Alle Prompts (öffentlich gelistet, nur published)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");
  const model = searchParams.get("model");
  const search = searchParams.get("search");
  const admin = searchParams.get("admin");

  const session = await auth();
  const isAdmin = isAdminSession(session);

  const where: Record<string, unknown> = {};

  // Admins sehen alle, andere nur veröffentlichte
  if (!admin || !isAdmin) {
    where.published = true;
  }

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }
  if (model) {
    where.model = model.toUpperCase();
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { content: { contains: search } },
    ];
  }

  const prompts = await prisma.prompt.findMany({
    where,
    include: {
      author: { select: { name: true, id: true } },
      category: true,
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(prompts);
}

// Neuen Prompt erstellen (Admin)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const description = formData.get("description") as string;
    const model = (formData.get("model") as string) || "ALLROUND";
    const categoryId = formData.get("categoryId") as string;
    const outputLink = formData.get("outputLink") as string;
    const outputCaption = formData.get("outputCaption") as string;
    const tagsRaw = formData.get("tags") as string;
    const published = formData.get("published") === "true";
    const imageFile = formData.get("outputImage") as File | null;

    let outputImageUrl: string | undefined;

    if (imageFile && imageFile.size > 0) {
      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const filename = safeImageFilename(imageFile);
      await writeFile(path.join(uploadDir, filename), buffer);
      outputImageUrl = `/uploads/${filename}`;
    }

    const slug = slugify(title);
    const tags = tagsRaw ? JSON.stringify(tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)) : "[]";

    const prompt = await prisma.prompt.create({
      data: {
        title,
        slug,
        content,
        description,
        model: model.toUpperCase(),
        categoryId,
        outputLink: outputLink || null,
        outputCaption: outputCaption || null,
        outputImageUrl,
        tags,
        published,
        authorId: session!.user.id,
      },
      include: { category: true },
    });

    // Benachrichtigungen versenden wenn veröffentlicht
    if (published) {
      await notifySubscribers(prompt.id, title, slug, prompt.categoryId);
    }

    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error("[Prompts POST]", error);
    return NextResponse.json({ error: "Fehler beim Erstellen." }, { status: 500 });
  }
}

async function notifySubscribers(promptId: string, title: string, slug: string, categoryId: string) {
  // Nutzer mit globalem "neue Prompts" Abo
  const globalSubs = await prisma.user.findMany({
    where: { notifyOnNewPrompt: true, approved: true },
    select: { email: true, name: true },
  });

  // Nutzer mit Kategorie-Abo
  const categorySubs = await prisma.subscription.findMany({
    where: { categoryId },
    include: { user: { select: { email: true, name: true, approved: true } } },
  });

  const recipients = new Map<string, string>();
  for (const u of globalSubs) recipients.set(u.email, u.name);
  for (const sub of categorySubs) {
    if (sub.user.approved) recipients.set(sub.user.email, sub.user.name);
  }

  await Promise.allSettled(Array.from(recipients, ([email, name]) => {
    const tmpl = emailTemplates.newPromptNotification(title, slug, name);
    return sendMail({ to: email, ...tmpl });
  }));
}
