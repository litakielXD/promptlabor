import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { isAdminSession } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  const { id } = await params;
  const { name, description, color, icon } = await req.json();

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const slug = name ? slugify(name) : existing.slug;

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      slug,
      description: description !== undefined ? description : existing.description,
      color: color ?? existing.color,
      icon: icon ?? existing.icon,
    },
    include: { _count: { select: { prompts: { where: { published: true } } } } },
  });

  return NextResponse.json({ success: true, category });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  const { id } = await params;

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
