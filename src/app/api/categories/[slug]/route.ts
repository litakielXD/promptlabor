import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/session";
import { uniqueCategorySlug } from "@/lib/slugs";
import { asTrimmedString, isValidHexColor } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  const { slug: id } = await params;
  const { name, description, color, icon } = await req.json();

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const cleanName = name !== undefined ? asTrimmedString(name, 120) : existing.name;
  const cleanDescription = description !== undefined ? asTrimmedString(description, 300) : existing.description;
  const cleanColor = typeof color === "string" && isValidHexColor(color) ? color : existing.color;
  const cleanIcon = icon !== undefined ? asTrimmedString(icon, 8) || "📁" : existing.icon;

  if (!cleanName) {
    return NextResponse.json({ error: "Name ist erforderlich." }, { status: 400 });
  }

  const nextSlug = cleanName !== existing.name
    ? await uniqueCategorySlug(cleanName, existing.id)
    : existing.slug;

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: cleanName,
      slug: nextSlug,
      description: cleanDescription || null,
      color: cleanColor,
      icon: cleanIcon,
    },
    include: { _count: { select: { prompts: { where: { published: true } } } } },
  });

  return NextResponse.json({ success: true, category });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  const { slug: id } = await params;

  const count = await prisma.prompt.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Kategorie enthält noch ${count} Prompt${count > 1 ? "s" : ""}. Bitte zuerst verschieben oder löschen.` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
