import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Repaso",
    short_name: "Repaso",
    description: "Your reviewers, kept safe.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7EFE2",
    theme_color: "#F7EFE2",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
