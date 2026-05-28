"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface NotificationSettings {
  notifyOnNewPrompt: boolean;
  notifyOnNewComment: boolean;
  subscriptions: {
    id: string;
    prompt?: { title: string; slug: string };
    category?: { name: string; slug: string; color: string; icon: string };
  }[];
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Passwort ändern
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/user/notifications")
        .then((r) => r.json())
        .then(setSettings);
    }
  }, [session]);

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    await fetch("/api/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notifyOnNewPrompt: settings.notifyOnNewPrompt,
        notifyOnNewComment: settings.notifyOnNewComment,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwLoading(true);
    const res = await fetch("/api/user/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    if (data.success) {
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setTimeout(() => setPwSuccess(false), 3000);
    } else {
      setPwError(data.error || "Fehler beim Speichern.");
    }
    setPwLoading(false);
  }

  if (status === "loading" || !settings) {
    return (
      <div className="page-content" style={{ display: "flex", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  const promptSubs = settings.subscriptions.filter((s) => s.prompt);
  const catSubs = settings.subscriptions.filter((s) => s.category);

  return (
    <div className="page-content">
      <div className="container">
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px" }}>
            Mein Konto
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "36px" }}>
            Hallo, <strong>{session?.user?.name}</strong> 👋
          </p>

          {/* Benachrichtigungseinstellungen */}
          <div className="card" style={{ padding: "28px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "20px" }}>
              🔔 Benachrichtigungen
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label className="toggle-wrapper">
                <span className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnNewPrompt}
                    onChange={(e) =>
                      setSettings((prev) => prev ? { ...prev, notifyOnNewPrompt: e.target.checked } : prev)
                    }
                  />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </span>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>Neue Prompts</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    E-Mail bei jedem neuen veröffentlichten Prompt
                  </div>
                </div>
              </label>

              <label className="toggle-wrapper">
                <span className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnNewComment}
                    onChange={(e) =>
                      setSettings((prev) => prev ? { ...prev, notifyOnNewComment: e.target.checked } : prev)
                    }
                  />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </span>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>Neue Kommentare (global)</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    E-Mail bei neuen Kommentaren zu allen Prompts
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "24px" }}>
              <button onClick={saveSettings} className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? <span className="spinner" /> : "Einstellungen speichern"}
              </button>
              {saved && <span style={{ color: "var(--accent-green)", fontSize: "0.85rem" }}>✓ Gespeichert</span>}
            </div>
          </div>

          {/* Abonnierte Prompts */}
          <div className="card" style={{ padding: "28px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>
              📌 Abonnierte Prompts
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
              Du kannst Prompts auf der Detailseite abonnieren um bei neuen Kommentaren benachrichtigt zu werden.
            </p>

            {promptSubs.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Noch keine Prompts abonniert.{" "}
                <Link href="/prompts" style={{ color: "var(--accent-purple-light)" }}>
                  Prompts entdecken →
                </Link>
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {promptSubs.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/prompts/${sub.prompt!.slug}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      background: "var(--bg-input)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span>📋</span>
                    <span>{sub.prompt!.title}</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "var(--text-muted)" }}>→</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Abonnierte Kategorien */}
          <div className="card" style={{ padding: "28px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>
              🗂️ Abonnierte Kategorien
            </h2>

            {catSubs.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Noch keine Kategorien abonniert.{" "}
                <Link href="/kategorien" style={{ color: "var(--accent-purple-light)" }}>
                  Kategorien entdecken →
                </Link>
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {catSubs.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/kategorien/${sub.category!.slug}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      background: "var(--bg-input)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span>{sub.category!.icon}</span>
                    <span>{sub.category!.name}</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "var(--text-muted)" }}>→</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {/* Passwort ändern */}
          <div className="card" style={{ padding: "28px", marginTop: "24px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>
              🔑 Passwort ändern
            </h2>
            <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="current-pw">Aktuelles Passwort</label>
                <input id="current-pw" type="password" className="form-input" value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)} required autoComplete="current-password" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-pw">Neues Passwort</label>
                <input id="new-pw" type="password" className="form-input" value={newPw}
                  onChange={(e) => setNewPw(e.target.value)} required minLength={8} autoComplete="new-password"
                  placeholder="Mindestens 8 Zeichen" />
              </div>
              {pwError && <div className="alert alert-error">{pwError}</div>}
              {pwSuccess && <div className="alert alert-success">✓ Passwort erfolgreich geändert</div>}
              <button type="submit" className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }} disabled={pwLoading}>
                {pwLoading ? <span className="spinner" /> : "Passwort speichern"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
