"use client";

import { AI_MODELS, type ModelKey } from "@/lib/utils";

interface ModelBadgeProps {
  model: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export default function ModelBadge({ model, showLabel = true, size = "md" }: ModelBadgeProps) {
  const key = model.toUpperCase() as ModelKey;
  const info = AI_MODELS[key];

  if (!info) return null;

  const className = `model-badge ${key.toLowerCase()} ${size === "sm" ? "btn-sm" : ""}`;

  return (
    <span className={className}>
      <span>{info.icon}</span>
      {showLabel && <span>{info.label}</span>}
    </span>
  );
}
