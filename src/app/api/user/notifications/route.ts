import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Benachrichtigungseinstellungen & Kategorie-Abos abrufen
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id! },
    select: {
      notifyOnNewPrompt: true,
      notifyOnNewComment: true,
      subscriptions: {
        include: {
          prompt: { select: { title: true, slug: true } },
          category: { select: { name: true, slug: true, color: true, icon: true } },
        },
      },
    },
  });

  return NextResponse.json(user);
}

// Benachrichtigungseinstellungen speichern
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });

  const { notifyOnNewPrompt, notifyOnNewComment } = await req.json();

  const user = await prisma.user.update({
    where: { id: session.user.id! },
    data: { notifyOnNewPrompt, notifyOnNewComment },
    select: { notifyOnNewPrompt: true, notifyOnNewComment: true },
  });

  return NextResponse.json({ success: true, ...user });
}
