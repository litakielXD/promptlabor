import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata: Metadata = {
  title: {
    default: "Promptlabor – Prompt-Bibliothek für Bildung",
    template: "%s | Promptlabor",
  },
  description:
    "Entdecke, teile und kommentiere KI-Prompts für Schule und Unterrichtsentwicklung. Eine Sammlung bewährter Prompts für ChatGPT, Claude, Gemini und NotebookLM.",
  keywords: ["KI", "Prompts", "Schule", "Unterricht", "ChatGPT", "Claude", "Gemini", "NotebookLM", "Lehrkräfte"],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    siteName: "Promptlabor",
    type: "website",
    locale: "de_DE",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('promptlabor-theme')==='warm'){document.documentElement.dataset.theme='warm'}}catch(e){}",
          }}
        />
        <SessionWrapper>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              <p>Promptlabor &copy; 2026 | <a href="https://mondschule.de/impressum.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Impressum</a></p>
            </footer>
          </div>
        </SessionWrapper>
      </body>
    </html>
  );
}
