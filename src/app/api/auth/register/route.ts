import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail, emailTemplates } from "@/lib/mail";
import { getRateLimitKey, rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(getRateLimitKey(req, "register"), 5, 60 * 60 * 1000);
    if (limited.limited) {
      return NextResponse.json(
        { error: "Zu viele Registrierungsversuche. Bitte später erneut versuchen." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds || 3600) } }
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Alle Felder sind erforderlich." }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim();

    if (password.length < 8) {
      return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits registriert." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
        role: "MEMBER",
        approved: false,
      },
    });

    // Bestätigungsmail an Nutzer
    const template = emailTemplates.registrationPending(normalizedName);
    const userMailSent = await sendMail({ to: normalizedEmail, ...template });
    if (!userMailSent) {
      console.error("[Register] Registrierungsmail konnte nicht gesendet werden:", normalizedEmail);
    }

    // Benachrichtigung an Admin
    if (process.env.ADMIN_EMAIL) {
      const adminUrl = escapeHtml(`${process.env.NEXTAUTH_URL}/admin`);
      const adminMailSent = await sendMail({
        to: process.env.ADMIN_EMAIL,
        subject: `Neue Registrierung: ${normalizedName}`,
        html: `
          <p>Ein neuer Nutzer hat sich registriert:</p>
          <ul>
            <li><strong>Name:</strong> ${escapeHtml(normalizedName)}</li>
            <li><strong>E-Mail:</strong> ${escapeHtml(normalizedEmail)}</li>
          </ul>
          <a href="${adminUrl}">Zur Nutzerverwaltung →</a>
        `,
      });
      if (!adminMailSent) {
        console.error("[Register] Admin-Benachrichtigung konnte nicht gesendet werden:", process.env.ADMIN_EMAIL);
      }
    }

    return NextResponse.json({ success: true, message: "Registrierung erfolgreich. Du wirst benachrichtigt, sobald dein Konto freigeschaltet wurde." });
  } catch (error) {
    console.error("[Register] Error:", error);
    return NextResponse.json({ error: "Interner Serverfehler." }, { status: 500 });
  }
}
