import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/session";
import { prepareImageUpload } from "@/lib/upload";
import { uniquePromptSlug } from "@/lib/slugs";
import { asTrimmedString, normalizeBoolean, normalizeOptionalUrl } from "@/lib/validation";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const ALLOWED_MODELS = new Set(["ALLROUND", "CHATGPT", "CLAUDE", "GEMINI", "NOTEBOOKLM"]);

// Einzelnen Prompt abrufen
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const prompt = await prisma.prompt.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true } },
      category: true,
      comments: {
        include: { author: { select: { name: true, id: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!prompt) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const session = await auth();
  const isAdmin = isAdminSession(session);

  if (!prompt.published && !isAdmin) {
    return NextResponse.json({ error: "Nicht verfügbar." }, { status: 404 });
  }

  return NextResponse.json(prompt);
}

// Prompt bearbeiten (Admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  const { slug } = await params;

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

    const existing = await prisma.prompt.findUnique({ where: { slug } });
    if (!existing) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

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

    let outputImageUrl = existing.outputImageUrl;

    if (imageFile && imageFile.size > 0) {
      const upload = await prepareImageUpload(imageFile);
      if (!upload.valid) {
        return NextResponse.json({ error: upload.error }, { status: 400 });
      }

      // Altes Bild löschen
      if (existing.outputImageUrl) {
        try {
          await unlink(path.join(process.cwd(), "public", existing.outputImageUrl));
        } catch {}
      }
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, upload.filename), upload.buffer);
      outputImageUrl = `/uploads/${upload.filename}`;
    }

    const newSlug = title !== existing.title ? await uniquePromptSlug(title, existing.id) : slug;
    const tags = tagsRaw ? JSON.stringify(tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)) : existing.tags;

    const prompt = await prisma.prompt.update({
      where: { slug },
      data: {
        title,
        slug: newSlug,
        content,
        description: description || null,
        model,
        categoryId,
        outputLink,
        outputCaption: outputCaption || null,
        outputImageUrl,
        tags,
        published,
      },
    });

    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error("[Prompt PATCH]", error);
    return NextResponse.json({ error: "Fehler beim Bearbeiten." }, { status: 500 });
  }
}

// Prompt löschen (Admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  const { slug } = await params;

  const prompt = await prisma.prompt.findUnique({ where: { slug } });
  if (!prompt) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  if (prompt.outputImageUrl) {
    try {
      await unlink(path.join(process.cwd(), "public", prompt.outputImageUrl));
    } catch {}
  }

  await prisma.prompt.delete({ where: { slug } });
  return NextResponse.json({ success: true });
}
