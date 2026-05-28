import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { isAdminSession } from "@/lib/session";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

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

    const existing = await prisma.prompt.findUnique({ where: { slug } });
    if (!existing) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

    let outputImageUrl = existing.outputImageUrl;

    if (imageFile && imageFile.size > 0) {
      // Altes Bild löschen
      if (existing.outputImageUrl) {
        try {
          await unlink(path.join(process.cwd(), "public", existing.outputImageUrl));
        } catch {}
      }
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const filename = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      await writeFile(path.join(uploadDir, filename), buffer);
      outputImageUrl = `/uploads/${filename}`;
    }

    const newSlug = title ? slugify(title) : slug;
    const tags = tagsRaw ? JSON.stringify(tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)) : existing.tags;

    const prompt = await prisma.prompt.update({
      where: { slug },
      data: {
        title: title || existing.title,
        slug: newSlug,
        content: content || existing.content,
        description: description !== undefined ? description : existing.description,
        model: model ? model.toUpperCase() : existing.model,
        categoryId: categoryId || existing.categoryId,
        outputLink: outputLink !== undefined ? outputLink || null : existing.outputLink,
        outputCaption: outputCaption !== undefined ? outputCaption || null : existing.outputCaption,
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
