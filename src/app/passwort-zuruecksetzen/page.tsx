"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiPath } from "@/lib/utils";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== passwordRepeat) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);
    const res = await fetch(apiPath("/auth/password-reset/confirm"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      setSuccess(true);
    } else {
      setError(data.error || "Passwort konnte nicht geändert werden.");
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 64px)", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🔐</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px" }}>Neues Passwort setzen</h1>
          <p style={{ color: "var(--text-secondary)" }}>Wähle ein neues Passwort mit mindestens 8 Zeichen.</p>
        </div>

        <div className="card" style={{ padding: "32px" }}>
          {!token ? (
            <div className="alert alert-error">Dieser Reset-Link ist unvollständig.</div>
          ) : success ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="alert alert-success">Dein Passwort wurde geändert. Du kannst dich jetzt anmelden.</div>
              <Link href="/login" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Zur Anmeldung
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="password">Neues Passwort</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password-repeat">Neues Passwort wiederholen</label>
                <input
                  id="password-repeat"
                  type="password"
                  className="form-input"
                  value={passwordRepeat}
                  onChange={(e) => setPasswordRepeat(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }} disabled={loading}>
                {loading ? <span className="spinner" /> : "Passwort speichern"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="page-content"><div className="spinner" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
