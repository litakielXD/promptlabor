import nodemailer from "nodemailer";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "1025"),
  secure: process.env.SMTP_SECURE === "true",
  ignoreTLS: process.env.SMTP_IGNORE_TLS === "true",
  tls: {
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
  },
  auth:
    process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
        }
      : undefined,
});

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || "Promptlabor <noreply@promptlabor.de>",
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("[Mail] Fehler beim Senden:", error);
    return false;
  }
}

// E-Mail-Templates
export const emailTemplates = {
  registrationPending: (name: string) => {
    const safeName = escapeHtml(name);
    return {
    subject: "Deine Registrierung bei Promptlabor",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #a78bfa; font-size: 24px; margin-bottom: 16px;">Willkommen bei Promptlabor! 🧪</h1>
        <p>Hallo ${safeName},</p>
        <p>deine Registrierung ist eingegangen. Dein Konto wird in Kürze freigeschaltet.</p>
        <p style="color: #94a3b8;">Du erhältst eine weitere E-Mail, sobald dein Konto aktiviert wurde.</p>
        <hr style="border-color: #1e293b; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b;">Promptlabor – Prompt-Bibliothek für Bildung</p>
      </div>
    `,
    };
  },

  accountApproved: (name: string) => {
    const safeName = escapeHtml(name);
    const loginUrl = escapeHtml(`${process.env.NEXTAUTH_URL}/login`);
    return {
    subject: "Dein Promptlabor-Konto wurde freigeschaltet!",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #4ade80; font-size: 24px; margin-bottom: 16px;">Konto freigeschaltet ✓</h1>
        <p>Hallo ${safeName},</p>
        <p>dein Konto bei Promptlabor wurde freigeschaltet. Du kannst dich jetzt anmelden und Prompts kommentieren.</p>
        <a href="${loginUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Jetzt anmelden →</a>
        <hr style="border-color: #1e293b; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b;">Promptlabor – Prompt-Bibliothek für Bildung</p>
      </div>
    `,
    };
  },

  passwordReset: (name: string, resetUrl: string) => {
    const safeName = escapeHtml(name);
    const safeUrl = escapeHtml(resetUrl);
    return {
    subject: "Passwort für Promptlabor zurücksetzen",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #a78bfa; font-size: 24px; margin-bottom: 16px;">Passwort zurücksetzen</h1>
        <p>Hallo ${safeName},</p>
        <p>für dein Promptlabor-Konto wurde ein Link zum Zurücksetzen des Passworts angefordert.</p>
        <p>Der Link ist 60 Minuten gültig.</p>
        <a href="${safeUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Neues Passwort setzen</a>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">Falls du das nicht angefordert hast, kannst du diese E-Mail ignorieren.</p>
        <hr style="border-color: #1e293b; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b;">Promptlabor – Prompt-Bibliothek für Bildung</p>
      </div>
    `,
    };
  },

  newPromptNotification: (promptTitle: string, promptSlug: string, userName: string) => {
    const safeTitle = escapeHtml(promptTitle);
    const safeName = escapeHtml(userName);
    const promptUrl = escapeHtml(`${process.env.NEXTAUTH_URL}/prompts/${promptSlug}`);
    const accountUrl = escapeHtml(`${process.env.NEXTAUTH_URL}/mein-konto`);
    return {
    subject: `Neuer Prompt: ${promptTitle}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #a78bfa; font-size: 24px; margin-bottom: 16px;">Neuer Prompt verfügbar 🧪</h1>
        <p>Hallo ${safeName},</p>
        <p>Es gibt einen neuen Prompt in deiner Bibliothek:</p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #7c3aed;">
          <strong style="color: #e2e8f0;">${safeTitle}</strong>
        </div>
        <a href="${promptUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Prompt ansehen →</a>
        <hr style="border-color: #1e293b; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b;">Promptlabor – <a href="${accountUrl}" style="color: #64748b;">Benachrichtigungen verwalten</a></p>
      </div>
    `,
    };
  },

  newCommentNotification: (promptTitle: string, promptSlug: string, commenterName: string, commentExcerpt: string, userName: string) => {
    const safeTitle = escapeHtml(promptTitle);
    const safeCommenter = escapeHtml(commenterName);
    const safeExcerpt = escapeHtml(commentExcerpt);
    const safeName = escapeHtml(userName);
    const commentsUrl = escapeHtml(`${process.env.NEXTAUTH_URL}/prompts/${promptSlug}#kommentare`);
    const accountUrl = escapeHtml(`${process.env.NEXTAUTH_URL}/mein-konto`);
    return {
    subject: `Neuer Kommentar zu: ${promptTitle}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
        <h1 style="color: #a78bfa; font-size: 24px; margin-bottom: 16px;">Neuer Kommentar 💬</h1>
        <p>Hallo ${safeName},</p>
        <p><strong>${safeCommenter}</strong> hat einen Kommentar zu <strong>${safeTitle}</strong> hinterlassen:</p>
        <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #0ea5e9; font-style: italic;">
          „${safeExcerpt}"
        </div>
        <a href="${commentsUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Kommentar ansehen →</a>
        <hr style="border-color: #1e293b; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b;">Promptlabor – <a href="${accountUrl}" style="color: #64748b;">Benachrichtigungen verwalten</a></p>
      </div>
    `,
    };
  },
};
