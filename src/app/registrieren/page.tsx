"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (data.success) {
      setSuccess(true);
    } else {
      setError(data.error || "Registrierung fehlgeschlagen.");
    }

    setLoading(false);
  }

  if (success) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 64px)", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "16px" }}>📬</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", marginBottom: "12px" }}>
            Registrierung eingegangen!
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "24px", lineHeight: "1.7" }}>
            Dein Konto wurde angelegt und wartet auf Freischaltung.
            Du erhältst eine E-Mail, sobald du mitmachen kannst.
          </p>
          <Link href="/prompts" className="btn btn-primary">
            Prompts entdecken →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 64px)", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🧪</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px" }}>Mitmachen</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Erstelle ein Konto um zu kommentieren und zu abonnieren
          </p>
        </div>

        <div className="card" style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Dein Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="z.B. Maria Müller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">E-Mail</label>
              <input
                id="reg-email"
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
              <label className="form-label" htmlFor="reg-password">Passwort</label>
              <input
                id="reg-password"
                type="password"
                className="form-input"
                placeholder="Mindestens 8 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <span className="form-hint">Mindestens 8 Zeichen</span>
            </div>

            {error && (
              <div className="alert alert-error">{error}</div>
            )}

            <div className="alert alert-info" style={{ fontSize: "0.85rem" }}>
              <span>ℹ️</span>
              <span>Nach der Registrierung wird dein Konto manuell freigeschaltet.</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "8px" }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "Registrieren"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Schon ein Konto?{" "}
          <Link href="/login" style={{ color: "var(--accent-purple-light)", fontWeight: "600" }}>
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
