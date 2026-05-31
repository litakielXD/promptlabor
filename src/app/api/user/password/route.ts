import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

// Passwort ändern
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });

  const limited = rateLimit(`password-change:${session.user.id}`, 8, 15 * 60 * 1000);
  if (limited.limited) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte später erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds || 900) } }
    );
  }

  const { currentPassword, newPassword } = await req.json();

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ error: "Beide Felder sind erforderlich." }, { status: 400 });
  }

  if (newPassword.length < 8 || newPassword.length > 200) {
    return NextResponse.json({ error: "Neues Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id! },
    select: { password: true },
  });

  if (!user) return NextResponse.json({ error: "Nutzer nicht gefunden." }, { status: 404 });

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Aktuelles Passwort ist falsch." }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id! },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ success: true });
}
