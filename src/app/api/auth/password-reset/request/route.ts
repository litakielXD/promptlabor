import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailTemplates, sendMail } from "@/lib/mail";
import { issuePasswordResetToken } from "@/lib/password-reset";
import { getRateLimitKey, rateLimit } from "@/lib/rate-limit";

const RESET_THROTTLE_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  const limited = rateLimit(getRateLimitKey(req, "password-reset"), 5, 60 * 60 * 1000);
  if (limited.limited) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte später erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds || 3600) } }
    );
  }

  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-Mail ist erforderlich." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true, passwordResetSentAt: true },
  });

  // Keine Account-Existenz verraten.
  if (!user) {
    return NextResponse.json({ success: true });
  }

  if (
    user.passwordResetSentAt &&
    user.passwordResetSentAt.getTime() > Date.now() - RESET_THROTTLE_MS
  ) {
    return NextResponse.json({ success: true });
  }

  const reset = await issuePasswordResetToken(user.id);
  const template = emailTemplates.passwordReset(user.name, reset.url);
  const sent = await sendMail({ to: user.email, ...template });

  if (!sent) {
    return NextResponse.json({ error: "Reset-Mail konnte nicht gesendet werden." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
