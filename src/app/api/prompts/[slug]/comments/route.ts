import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendMail, emailTemplates } from "@/lib/mail";
import { truncate } from "@/lib/utils";
import { isApprovedSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

const MAX_COMMENT_LENGTH = 2000;

// Kommentar erstellen
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Bitte einloggen." }, { status: 401 });
  }
  if (!isApprovedSession(session)) {
    return NextResponse.json({ error: "Konto noch nicht freigeschaltet." }, { status: 403 });
  }
  const limited = rateLimit(`comment:${session.user.id}`, 20, 60 * 60 * 1000);
  if (limited.limited) {
    return NextResponse.json(
      { error: "Zu viele Kommentare in kurzer Zeit. Bitte später erneut versuchen." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds || 3600) } }
    );
  }

  const { slug } = await params;
  const { content, isSuccessStory } = await req.json();

  if (!content || content.trim().length < 3) {
    return NextResponse.json({ error: "Kommentar ist zu kurz." }, { status: 400 });
  }

  if (content.trim().length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: `Kommentar darf maximal ${MAX_COMMENT_LENGTH} Zeichen haben.` }, { status: 400 });
  }

  const prompt = await prisma.prompt.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true },
  });
  if (!prompt) return NextResponse.json({ error: "Prompt nicht gefunden." }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      isSuccessStory: isSuccessStory || false,
      authorId: session.user.id!,
      promptId: prompt.id,
    },
    include: { author: { select: { name: true, id: true } } },
  });

  // Benachrichtigungen an Prompt-Abonnenten
  await notifyCommentSubscribers(
    prompt.id,
    prompt.title,
    prompt.slug,
    comment.author.name,
    content,
    session.user.id!
  );

  return NextResponse.json({ success: true, comment });
}

async function notifyCommentSubscribers(
  promptId: string,
  promptTitle: string,
  promptSlug: string,
  commenterName: string,
  commentContent: string,
  commentAuthorId: string
) {
  // Nutzer mit globalem Kommentar-Abo
  const globalSubs = await prisma.user.findMany({
    where: {
      notifyOnNewComment: true,
      approved: true,
      id: { not: commentAuthorId }, // Nicht sich selbst benachrichtigen
    },
    select: { email: true, name: true },
  });

  // Nutzer, die diesen Prompt abonniert haben
  const promptSubs = await prisma.subscription.findMany({
    where: { promptId, user: { id: { not: commentAuthorId } } },
    include: { user: { select: { email: true, name: true, approved: true } } },
  });

  const recipients = new Map<string, string>();
  for (const u of globalSubs) recipients.set(u.email, u.name);
  for (const sub of promptSubs) {
    if (sub.user.approved) recipients.set(sub.user.email, sub.user.name);
  }

  const excerpt = truncate(commentContent, 120);

  await Promise.allSettled(Array.from(recipients, ([email, name]) => {
    const tmpl = emailTemplates.newCommentNotification(
      promptTitle,
      promptSlug,
      commenterName,
      excerpt,
      name
    );
    return sendMail({ to: email, ...tmpl });
  }));
}
