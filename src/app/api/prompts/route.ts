import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendMail, emailTemplates } from "@/lib/mail";
import { isAdminSession } from "@/lib/session";
import { prepareImageUpload } from "@/lib/upload";
import { uniquePromptSlug } from "@/lib/slugs";
import { asTrimmedString, normalizeBoolean, normalizeOptionalUrl } from "@/lib/validation";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_MODELS = new Set(["ALLROUND", "CHATGPT", "CLAUDE", "GEMINI", "NOTEBOOKLM"]);

// Alle Prompts (öffentlich gelistet, nur published)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");
  const model = searchParams.get("model");
  const search = searchParams.get("search");
  const admin = searchParams.get("admin");
  const takeParam = searchParams.get("take");
  const take = takeParam ? Math.min(parseInt(takeParam, 10), 100) : undefined;

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

  const [prompts, total] = await prisma.$transaction([
    prisma.prompt.findMany({
      where,
      include: {
        author: { select: { name: true, id: true } },
        category: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      ...(take ? { take } : {}),
    }),
    prisma.prompt.count({ where }),
  ]);

  // Wenn kein take-Parameter → altes Verhalten (reines Array) für Rückwärtskompatibilität
  if (!take) return NextResponse.json(prompts);

  return NextResponse.json({ prompts, total });
}

// Neuen Prompt erstellen (Admin)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const title = asTrimmedString(formData.get("title"), 180);
    const content = asTrimmedString(formData.get("content"), 30000);
    const description = asTrimmedString(formData.get("description"), 500);
    const model = asTrimmedString(formData.get("model"), 40).toUpperCase() || "ALLROUND";
    const categoryId = asTrimmedString(formData.get("categoryId"), 80);
    const outputLinkRaw = asTrimmedString(formData.get("outputLink"), 500);
    const outputLink = normalizeOptionalUrl(outputLinkRaw);
    const outputCaption = asTrimmedString(formData.get("outputCaption"), 300);
    const tagsRaw = asTrimmedString(formData.get("tags"), 1000);
    const published = normalizeBoolean(formData.get("published"));
    const imageFile = formData.get("outputImage") as File | null;

    if (!title || !content || !categoryId) {
      return NextResponse.json({ error: "Titel, Inhalt und Kategorie sind erforderlich." }, { status: 400 });
    }
    if (!ALLOWED_MODELS.has(model)) {
      return NextResponse.json({ error: "Unbekanntes Modell." }, { status: 400 });
    }
    if (outputLinkRaw && !outputLink) {
      return NextResponse.json({ error: "Der Output-Link muss eine gültige http(s)-URL sein." }, { status: 400 });
    }
    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!category) {
      return NextResponse.json({ error: "Kategorie nicht gefunden." }, { status: 400 });
    }

    let outputImageUrl: string | undefined;

    if (imageFile && imageFile.size > 0) {
      const upload = await prepareImageUpload(imageFile);
      if (!upload.valid) {
        return NextResponse.json({ error: upload.error }, { status: 400 });
      }

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, upload.filename), upload.buffer);
      outputImageUrl = `/uploads/${upload.filename}`;
    }

    const slug = await uniquePromptSlug(title);
    const tags = tagsRaw ? JSON.stringify(tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)) : "[]";

    const prompt = await prisma.prompt.create({
      data: {
        title,
        slug,
        content,
        description,
        model,
        categoryId,
        outputLink,
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
