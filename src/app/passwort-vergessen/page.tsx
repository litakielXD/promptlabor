"use client";

import { useState } from "react";
import Link from "next/link";
import { apiPath } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(apiPath("/auth/password-reset/request"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      setSuccess(true);
    } else {
      setError(data.error || "Reset-Link konnte nicht gesendet werden.");
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 64px)", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🔑</div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px" }}>Passwort vergessen?</h1>
          <p style={{ color: "var(--text-secondary)" }}>Wir senden dir einen Link zum Zurücksetzen.</p>
        </div>

        <div className="card" style={{ padding: "32px" }}>
          {success ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="alert alert-success">
                Wenn ein Konto zu dieser E-Mail existiert, wurde ein Reset-Link verschickt.
              </div>
              <Link href="/login" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Zur Anmeldung
              </Link>
            </div>
          ) : (
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

              {error && <div className="alert alert-error">{error}</div>}

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }} disabled={loading}>
                {loading ? <span className="spinner" /> : "Reset-Link senden"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
