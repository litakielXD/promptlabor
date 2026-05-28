import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { isAdminSession } from "@/lib/session";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { prompts: { where: { published: true } } } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  const { name, description, color, icon } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Name ist erforderlich." }, { status: 400 });
  }

  const slug = slugify(name);

  const category = await prisma.category.create({
    data: { name, slug, description, color: color || "#6366f1", icon: icon || "📁" },
  });

  return NextResponse.json({ success: true, category });
}
