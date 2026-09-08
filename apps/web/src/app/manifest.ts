import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Right Spot",
    short_name: "TRS",
    description: "Photography spot discovery",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF8",
    theme_color: "#8B7355",
  };
}
