import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Abo-Status für eine Kategorie prüfen
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ subscribed: false });

  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (!category) return NextResponse.json({ subscribed: false });

  const sub = await prisma.subscription.findUnique({
    where: { userId_categoryId: { userId: session.user.id!, categoryId: category.id } },
  });

  return NextResponse.json({ subscribed: !!sub });
}

// Kategorie abonnieren / abbestellen
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Bitte einloggen." }, { status: 401 });

  const { slug } = await params;
  const { action } = await req.json();

  const category = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (!category) return NextResponse.json({ error: "Kategorie nicht gefunden." }, { status: 404 });

  if (action === "subscribe") {
    await prisma.subscription.upsert({
      where: { userId_categoryId: { userId: session.user.id!, categoryId: category.id } },
      create: { userId: session.user.id!, categoryId: category.id },
      update: {},
    });
    return NextResponse.json({ subscribed: true });
  } else {
    await prisma.subscription.deleteMany({
      where: { userId: session.user.id!, categoryId: category.id },
    });
    return NextResponse.json({ subscribed: false });
  }
}
