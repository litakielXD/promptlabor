"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPath, formatRelativeDate } from "@/lib/utils";
import { isAdminSession } from "@/lib/session";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  createdAt: string;
}

interface Prompt {
  id: string;
  title: string;
  slug: string;
  model: string;
  published: boolean;
  createdAt: string;
  category: { name: string; icon: string };
  _count: { comments: number };
}

interface DashboardData {
  pendingUsers: User[];
  allUsers: User[];
  prompts: Prompt[];
  promptCount: number;
  commentCount: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordResetStatus, setPasswordResetStatus] = useState<Record<string, "sending" | "sent" | "error">>({});
  const isAdmin = isAdminSession(session);

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !isAdmin)) {
      router.push("/");
    }
  }, [status, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;

    Promise.all([
      fetch(apiPath("/admin/users")).then((r) => r.json()),
      fetch(apiPath("/prompts?admin=true")).then((r) => r.json()),
    ]).then(([users, prompts]) => {
      setData({
        pendingUsers: users.filter((u: User) => !u.approved),
        allUsers: users,
        prompts,
        promptCount: prompts.length,
        commentCount: 0,
      });
      setLoading(false);
    });
  }, [isAdmin]);

  async function approveUser(id: string, approved: boolean) {
    await fetch(apiPath(`/admin/users/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    setData((prev) =>
      prev
        ? {
            ...prev,
            allUsers: prev.allUsers.map((u) =>
              u.id === id ? { ...u, approved } : u
            ),
            pendingUsers: prev.pendingUsers.filter((u) => u.id !== id),
          }
        : prev
    );
  }

  async function deleteUser(id: string) {
    if (!confirm("Nutzer wirklich löschen?")) return;
    await fetch(apiPath(`/admin/users/${id}`), { method: "DELETE" });
    setData((prev) =>
      prev
        ? {
            ...prev,
            allUsers: prev.allUsers.filter((u) => u.id !== id),
            pendingUsers: prev.pendingUsers.filter((u) => u.id !== id),
          }
        : prev
    );
  }

  async function sendPasswordReset(user: User) {
    setPasswordResetStatus((prev) => ({ ...prev, [user.id]: "sending" }));
    const res = await fetch(apiPath(`/admin/users/${user.id}/password-reset`), {
      method: "POST",
    });

    setPasswordResetStatus((prev) => ({ ...prev, [user.id]: res.ok ? "sent" : "error" }));

    if (res.ok) {
      setTimeout(() => {
        setPasswordResetStatus((prev) => {
          const next = { ...prev };
          delete next[user.id];
          return next;
        });
      }, 4000);
    }
  }

  if (loading || !data) {
    return (
      <div className="page-content" style={{ display: "flex", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "800" }}>Admin-Bereich</h1>
            <p style={{ color: "var(--text-secondary)" }}>Nutzerverwaltung und Statistiken</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href="/admin/kategorien" className="btn btn-ghost">
              📁 Kategorien
            </Link>
            <Link href="/admin/prompts/neu" className="btn btn-primary">
              + Neuer Prompt
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "36px" }}>
          {[
            { label: "Ausstehende Anmeldungen", value: data.pendingUsers.length, color: "var(--accent-yellow)", icon: "⏳" },
            { label: "Registrierte Nutzer", value: data.allUsers.length, color: "var(--accent-blue)", icon: "👥" },
            { label: "Veröffentlichte Prompts", value: data.promptCount, color: "var(--accent-purple-light)", icon: "🧪" },
          ].map((stat) => (
            <div key={stat.label} className="card" style={{ padding: "20px" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>{stat.icon}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "800", color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Ausstehende Nutzer */}
        {data.pendingUsers.length > 0 && (
          <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>
              ⏳ Warten auf Freischaltung ({data.pendingUsers.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.pendingUsers.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    background: "rgba(245, 158, 11, 0.08)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600" }}>{user.name}</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      {user.email} · registriert {formatRelativeDate(user.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => approveUser(user.id, true)}
                      className="btn btn-sm"
                      style={{ background: "rgba(16,185,129,0.15)", color: "var(--accent-green)", border: "1px solid rgba(16,185,129,0.3)" }}
                    >
                      ✓ Freischalten
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Ablehnen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alle Prompts */}
        <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
              🧪 Alle Prompts ({data.prompts.length})
            </h2>
            <Link href="/admin/prompts/neu" className="btn btn-ghost btn-sm">+ Neu</Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Titel", "Kategorie", "Modell", "Status", "Erstellt", "Aktionen"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: "600", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.prompts.map((prompt) => (
                  <tr key={prompt.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px", fontWeight: "500", maxWidth: "260px" }}>
                      <Link href={`/prompts/${prompt.slug}`} style={{ color: "var(--text-primary)" }}>
                        {prompt.title}
                      </Link>
                    </td>
                    <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {prompt.category.icon} {prompt.category.name}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {prompt.model === "ALLROUND" ? (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Allround</span>
                      ) : (
                        <span className="badge badge-purple" style={{ fontSize: "0.72rem" }}>{prompt.model}</span>
                      )}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span className={`badge ${prompt.published ? "badge-green" : "badge-yellow"}`}>
                        {prompt.published ? "Veröffentlicht" : "Entwurf"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      {formatRelativeDate(prompt.createdAt)}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Link href={`/admin/prompts/${prompt.slug}/bearbeiten`} className="btn btn-ghost btn-sm">
                        ✏️ Bearbeiten
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alle Nutzer */}
        <div className="card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>
            👥 Alle Nutzer ({data.allUsers.length})
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Name", "E-Mail", "Rolle", "Status", "Registriert", "Aktionen"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: "600", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.allUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px" }}>{user.name}</td>
                    <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{user.email}</td>
                    <td style={{ padding: "12px" }}>
                      <span className={`badge ${user.role === "ADMIN" ? "badge-purple" : "badge-green"}`}>
                        {user.role === "ADMIN" ? "Admin" : "Mitglied"}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span className={`badge ${user.approved ? "badge-green" : "badge-yellow"}`}>
                        {user.approved ? "Aktiv" : "Ausstehend"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      {formatRelativeDate(user.createdAt)}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => sendPasswordReset(user)}
                          className="btn btn-ghost btn-sm"
                          disabled={passwordResetStatus[user.id] === "sending"}
                          title="Reset-Link per E-Mail senden"
                        >
                          {passwordResetStatus[user.id] === "sending"
                            ? "Sende..."
                            : passwordResetStatus[user.id] === "sent"
                              ? "Reset gesendet"
                              : passwordResetStatus[user.id] === "error"
                                ? "Fehler"
                                : "Passwort resetten"}
                        </button>
                        {!user.approved && (
                          <button onClick={() => approveUser(user.id, true)} className="btn btn-sm" style={{ background: "rgba(16,185,129,0.15)", color: "var(--accent-green)", border: "1px solid rgba(16,185,129,0.3)" }}>
                            ✓
                          </button>
                        )}
                        {user.approved && user.role !== "ADMIN" && (
                          <button onClick={() => approveUser(user.id, false)} className="btn btn-ghost btn-sm">
                            Sperren
                          </button>
                        )}
                        {user.role !== "ADMIN" && (
                          <button onClick={() => deleteUser(user.id)} className="btn btn-danger btn-sm">
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
