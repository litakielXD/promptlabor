import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashPasswordResetToken, isPasswordResetExpired } from "@/lib/password-reset";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Reset-Link ist ungültig." }, { status: 400 });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Das neue Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
  }

  const tokenHash = hashPasswordResetToken(token);
  const user = await prisma.user.findFirst({
    where: { passwordResetTokenHash: tokenHash },
    select: { id: true, passwordResetExpires: true },
  });

  if (!user || isPasswordResetExpired(user.passwordResetExpires)) {
    return NextResponse.json({ error: "Der Reset-Link ist ungültig oder abgelaufen." }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
      passwordResetSentAt: null,
    },
  });

  return NextResponse.json({ success: true });
}
