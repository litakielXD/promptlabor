"use client";

import { SessionProvider } from "next-auth/react";
import { apiPath } from "@/lib/utils";

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath={apiPath("/auth")}>{children}</SessionProvider>;
}
