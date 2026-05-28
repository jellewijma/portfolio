"use client";

import { useMemo, useState } from "react";

type Category = "all" | "car" | "landscape" | "street";

type Photo = {
  title: string;
  category: Exclude<Category, "all">;
  image: string;
  alt: string;
};

const photos: Photo[] = [
  { title: "Vrolijke Drukte", category: "car", image: "/assets/images/optimized/classic-car-warm-scene-1200.jpg", alt: "Classic car scene with warm color" },
  { title: "Stoer Chic", category: "car", image: "/assets/images/optimized/low-angle-automotive-1200.jpg", alt: "Low angle automotive photograph" },
  { title: "Hout Oud", category: "car", image: "/assets/images/optimized/vintage-car-wood-detail-1200.jpg", alt: "Vintage automotive detail near wood textures" },
  { title: "Helder Gebouw", category: "car", image: "/assets/images/optimized/automotive-architecture-1200.jpg", alt: "Automotive photograph near modern architecture" },
  { title: "Chrome Line", category: "car", image: "/assets/images/optimized/automotive-chrome-detail-1200.jpg", alt: "Automotive chrome detail" },
  { title: "Passing Frame", category: "street", image: "/assets/images/optimized/street-passing-frame-1200.jpg", alt: "Street photograph captured on film" },
  { title: "Quiet Corner", category: "street", image: "/assets/images/optimized/street-quiet-corner-1200.jpg", alt: "Moody street scene" },
  { title: "Open Light", category: "landscape", image: "/assets/images/optimized/landscape-open-light-1200.jpg", alt: "High contrast landscape image" },
  { title: "Last Ridge", category: "landscape", image: "/assets/images/optimized/landscape-last-ridge-768.jpg", alt: "Landscape photograph with a distant ridge" },
];

const filters: Category[] = ["all", "car", "landscape", "street"];

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState<Category>("all");
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);

  const visiblePhotos = useMemo(
    () => photos.filter((photo) => activeFilter === "all" || photo.category === activeFilter),
    [activeFilter],
  );

  return (
    <main className="page">
      <h1>Gallery</h1>
      <p>Automotive, street, and landscape images from the same visual world as the portfolio.</p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "1rem 0 2rem" }}>
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            aria-pressed={activeFilter === filter}
            style={{
              border: "1px solid #666",
              background: activeFilter === filter ? "#f5f5f5" : "transparent",
              color: activeFilter === filter ? "#111" : "#f5f5f5",
              padding: "0.5rem 0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        }}
      >
        {visiblePhotos.map((photo) => (
          <button
            key={photo.title}
            type="button"
            onClick={() => setActivePhoto(photo)}
            style={{
              border: "1px solid #333",
              background: "#111",
              color: "inherit",
              padding: 0,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <img src={photo.image} alt={photo.alt} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover" }} loading="lazy" />
            <div style={{ padding: "0.75rem" }}>
              <div style={{ opacity: 0.7, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.08em" }}>{photo.category}</div>
              <div style={{ marginTop: "0.25rem", fontWeight: 700 }}>{photo.title}</div>
            </div>
          </button>
        ))}
      </div>

      {activePhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.title}
          onClick={() => setActivePhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "grid",
            placeItems: "center",
            padding: "1rem",
          }}
        >
          <figure onClick={(event) => event.stopPropagation()} style={{ margin: 0, maxWidth: "1000px", width: "100%" }}>
            <img src={activePhoto.image} alt={activePhoto.alt} style={{ width: "100%", maxHeight: "80vh", objectFit: "contain" }} />
            <figcaption style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between" }}>
              <strong>{activePhoto.title}</strong>
              <span style={{ textTransform: "uppercase", opacity: 0.75 }}>{activePhoto.category}</span>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </main>
  );
}
