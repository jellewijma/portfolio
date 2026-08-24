import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://jellewijma.com", changeFrequency: "monthly", priority: 1 },
    { url: "https://jellewijma.com/projects", changeFrequency: "monthly", priority: 0.8 },
    { url: "https://jellewijma.com/about", changeFrequency: "yearly", priority: 0.6 },
    { url: "https://jellewijma.com/gallery", changeFrequency: "monthly", priority: 0.8 },
  ];
}
