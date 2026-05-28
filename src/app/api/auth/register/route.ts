import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail, emailTemplates } from "@/lib/mail";
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
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Alle Felder sind erforderlich." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits registriert." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "MEMBER",
        approved: false,
      },
    });

    // Bestätigungsmail an Nutzer
    const template = emailTemplates.registrationPending(name);
    const userMailSent = await sendMail({ to: email, ...template });
    if (!userMailSent) {
      console.error("[Register] Registrierungsmail konnte nicht gesendet werden:", email);
    }

    // Benachrichtigung an Admin
    if (process.env.ADMIN_EMAIL) {
      const adminUrl = escapeHtml(`${process.env.NEXTAUTH_URL}/admin`);
      const adminMailSent = await sendMail({
        to: process.env.ADMIN_EMAIL,
        subject: `Neue Registrierung: ${name}`,
        html: `
          <p>Ein neuer Nutzer hat sich registriert:</p>
          <ul>
            <li><strong>Name:</strong> ${escapeHtml(name)}</li>
            <li><strong>E-Mail:</strong> ${escapeHtml(email)}</li>
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
