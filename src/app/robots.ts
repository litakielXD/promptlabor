import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://mondschule.de/promptlabor";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/mein-konto"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
