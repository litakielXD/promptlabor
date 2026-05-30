import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emailTemplates, sendMail } from "@/lib/mail";
import { issuePasswordResetToken } from "@/lib/password-reset";
import { isAdminSession } from "@/lib/session";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Nutzer nicht gefunden." }, { status: 404 });
  }

  const reset = await issuePasswordResetToken(user.id);
  const template = emailTemplates.passwordReset(user.name, reset.url);
  const sent = await sendMail({ to: user.email, ...template });

  if (!sent) {
    return NextResponse.json({ error: "Reset-Mail konnte nicht gesendet werden." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
