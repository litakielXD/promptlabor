import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/session";
import { uniqueCategorySlug } from "@/lib/slugs";
import { asTrimmedString, isValidHexColor } from "@/lib/validation";

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
  const cleanName = asTrimmedString(name, 120);
  const cleanDescription = asTrimmedString(description, 300);
  const cleanColor = typeof color === "string" && isValidHexColor(color) ? color : "#6366f1";
  const cleanIcon = asTrimmedString(icon, 8) || "📁";

  if (!cleanName) {
    return NextResponse.json({ error: "Name ist erforderlich." }, { status: 400 });
  }

  const slug = await uniqueCategorySlug(cleanName);

  const category = await prisma.category.create({
    data: {
      name: cleanName,
      slug,
      description: cleanDescription || null,
      color: cleanColor,
      icon: cleanIcon,
    },
  });

  return NextResponse.json({ success: true, category });
}
