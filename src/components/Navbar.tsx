"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { isAdminSession } from "@/lib/session";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = isAdminSession(session);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <div className="logo-icon">🧪</div>
          Promptlabor
        </Link>

        <div className="navbar-nav">
          <Link href="/prompts" className={`nav-link ${pathname.startsWith("/prompts") ? "active" : ""}`}>
            Prompts
          </Link>
          <Link href="/kategorien" className={`nav-link ${pathname.startsWith("/kategorien") ? "active" : ""}`}>
            Kategorien
          </Link>
          {isAdmin && (
            <Link href="/admin" className={`nav-link ${pathname.startsWith("/admin") ? "active" : ""}`}>
              ⚙️ Admin
            </Link>
          )}
        </div>

        <div className="navbar-actions">
          <ThemeToggle />
          {session ? (
            <>
              <Link href="/mein-konto" className="btn btn-ghost btn-sm">
                👤 {session.user?.name}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn btn-secondary btn-sm"
              >
                Abmelden
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Anmelden
              </Link>
              <Link href="/registrieren" className="btn btn-primary btn-sm">
                Registrieren
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
