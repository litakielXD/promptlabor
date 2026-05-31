import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const prompt = await prisma.prompt.findUnique({
    where: { slug, published: true },
    select: {
      title: true,
      description: true,
      model: true,
      content: true,
      category: { select: { name: true, icon: true } },
    },
  });

  if (!prompt) {
    return { title: "Prompt nicht gefunden – Promptlabor" };
  }

  const modelLabel: Record<string, string> = {
    CHATGPT: "ChatGPT",
    CLAUDE: "Claude",
    GEMINI: "Gemini",
    NOTEBOOKLM: "NotebookLM",
    ALLROUND: "KI-Prompt",
  };

  const description =
    prompt.description ||
    prompt.content.slice(0, 155).replace(/\n/g, " ") + "…";

  const title = `${prompt.title} – ${modelLabel[prompt.model] ?? prompt.model} Prompt`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "Promptlabor",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function PromptLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
