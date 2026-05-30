import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MINUTES = 60;

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetToken() {
  return crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
}

export function passwordResetUrl(token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl}/passwort-zuruecksetzen?token=${encodeURIComponent(token)}`;
}

export async function issuePasswordResetToken(userId: string) {
  const token = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: expires,
      passwordResetSentAt: new Date(),
    },
  });

  return {
    token,
    expires,
    url: passwordResetUrl(token),
  };
}

export function isPasswordResetExpired(expires: Date | null) {
  return !expires || expires.getTime() < Date.now();
}
