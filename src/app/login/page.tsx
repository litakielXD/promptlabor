"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error === "PENDING_APPROVAL") {
      setError("Dein Konto wurde noch nicht freigeschaltet. Bitte warte auf die Bestätigung.");
    } else if (result?.error) {
      setError("E-Mail oder Passwort falsch.");
    } else {
      router.push("/");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 64px)", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🧪</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px" }}>Willkommen zurück</h1>
          <p style={{ color: "var(--text-secondary)" }}>Melde dich mit deinem Konto an</p>
        </div>

        <div className="card" style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">E-Mail</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="deine@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <label className="form-label" htmlFor="password">Passwort</label>
                <Link href="/passwort-vergessen" style={{ color: "var(--accent-purple-light)", fontSize: "0.82rem", fontWeight: "600" }}>
                  Vergessen?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="alert alert-error">{error}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "8px" }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "Anmelden"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Noch kein Konto?{" "}
          <Link href="/registrieren" style={{ color: "var(--accent-purple-light)", fontWeight: "600" }}>
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
