"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface CategorySubscribeButtonProps {
  categorySlug: string;
}

export default function CategorySubscribeButton({ categorySlug }: CategorySubscribeButtonProps) {
  const { data: session } = useSession();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/categories/${categorySlug}/subscribe`)
      .then((r) => r.json())
      .then((d) => setSubscribed(d.subscribed));
  }, [session, categorySlug]);

  if (!session) return null;

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/categories/${categorySlug}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: subscribed ? "unsubscribe" : "subscribe" }),
    });
    const data = await res.json();
    setSubscribed(data.subscribed);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`btn btn-sm ${subscribed ? "btn-secondary" : "btn-ghost"}`}
      title={subscribed ? "Kategorie-Abo kündigen" : "Benachrichtigung bei neuen Prompts"}
    >
      {loading ? <span className="spinner" style={{ width: "14px", height: "14px" }} /> : subscribed ? "🔔 Kategorie abonniert" : "🔕 Kategorie abonnieren"}
    </button>
  );
}
