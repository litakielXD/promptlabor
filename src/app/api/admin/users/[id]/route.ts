import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendMail, emailTemplates } from "@/lib/mail";
import { isAdminSession } from "@/lib/session";

// Admin: Nutzer freischalten
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  const { id } = await params;
  const { approved } = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: { approved },
  });

  if (approved) {
    const template = emailTemplates.accountApproved(user.name);
    await sendMail({ to: user.email, ...template });
  }

  return NextResponse.json({ success: true, user });
}

// Admin: Nutzer löschen
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  const { id } = await params;

  // Eigenes Konto nicht löschbar
  if (id === session?.user.id) {
    return NextResponse.json({ error: "Du kannst dein eigenes Konto nicht löschen." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
