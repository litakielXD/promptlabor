import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/session";

// Kommentar löschen (Admin oder Autor)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });

  const { id } = await params;

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!comment) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const isAdmin = isAdminSession(session);
  const isAuthor = comment.authorId === session.user.id;

  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
