import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CampusMatch — verified student matchmaking",
    short_name: "CampusMatch",
    description:
      "A trust-first matchmaking space for verified university students in Bangladesh.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF7F1",
    theme_color: "#12452A",
    lang: "bn",
    dir: "ltr",
    categories: ["social", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
