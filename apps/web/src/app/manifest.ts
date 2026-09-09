import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "spots",
    short_name: "spots",
    description: "The places your best photographs come from.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#4574C4",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
