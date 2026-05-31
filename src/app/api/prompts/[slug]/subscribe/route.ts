import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession, isApprovedSession } from "@/lib/session";

// Abo-Status prüfen
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ subscribed: false });

  const { slug } = await params;
  const prompt = await prisma.prompt.findUnique({ where: { slug }, select: { id: true, published: true } });
  if (!prompt) return NextResponse.json({ subscribed: false });
  if (!prompt.published && !isAdminSession(session)) return NextResponse.json({ subscribed: false });

  const sub = await prisma.subscription.findUnique({
    where: { userId_promptId: { userId: session.user.id!, promptId: prompt.id } },
  });

  return NextResponse.json({ subscribed: !!sub });
}

// Abonnieren / Abbestellen
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Bitte einloggen." }, { status: 401 });
  if (!isApprovedSession(session)) {
    return NextResponse.json({ error: "Konto noch nicht freigeschaltet." }, { status: 403 });
  }

  const { slug } = await params;
  const { action } = await req.json(); // "subscribe" | "unsubscribe"
  if (action !== "subscribe" && action !== "unsubscribe") {
    return NextResponse.json({ error: "Ungültige Aktion." }, { status: 400 });
  }

  const prompt = await prisma.prompt.findUnique({ where: { slug }, select: { id: true, published: true } });
  if (!prompt) return NextResponse.json({ error: "Prompt nicht gefunden." }, { status: 404 });
  if (!prompt.published && !isAdminSession(session)) {
    return NextResponse.json({ error: "Prompt nicht verfügbar." }, { status: 404 });
  }

  if (action === "subscribe") {
    await prisma.subscription.upsert({
      where: { userId_promptId: { userId: session.user.id!, promptId: prompt.id } },
      create: { userId: session.user.id!, promptId: prompt.id },
      update: {},
    });
    return NextResponse.json({ subscribed: true });
  } else {
    await prisma.subscription.deleteMany({
      where: { userId: session.user.id!, promptId: prompt.id },
    });
    return NextResponse.json({ subscribed: false });
  }
}
