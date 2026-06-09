import type { Metadata } from "next";
import { GalleryGrid, Lightbox, PublicScripts, SiteNav } from "../portfolio-content";

export const metadata: Metadata = {
  title: "Jelle Wijma | Gallery",
  description: "Photography gallery by Jelle Wijma, featuring automotive, street, and landscape images.",
};

export default function GalleryPage() {
  return (
    <>
      <div id="page-shell">
        <SiteNav page="gallery" />

        <main className="pt-[88px]">
          <header className="grid border-b border-[#ffffff26] xl:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-12 xl:border-r xl:border-[#ffffff26]">
              <p className="text-sm uppercase tracking-[0.32em] text-[#ffffff80]">Selected photography</p>
              <h1 className="mt-8 text-5xl font-bold leading-none sm:text-7xl">Gallery</h1>
            </div>
            <div className="flex flex-col justify-end border-t border-[#ffffff26] p-6 sm:p-12 xl:border-t-0">
              <p className="max-w-xl text-lg leading-8 text-[#ffffffb3]">
                Automotive, street, and landscape images from the same visual world as the portfolio.
              </p>
              <div className="mt-8 flex flex-wrap gap-3" aria-label="Gallery filters">
                <button
                  type="button"
                  data-filter="all"
                  className="filter-button border px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition hover:border-white hover:text-white"
                  aria-pressed="true"
                >
                  All
                </button>
                <button
                  type="button"
                  data-filter="car"
                  className="filter-button border px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition hover:border-white hover:text-white"
                  aria-pressed="false"
                >
                  Car
                </button>
                <button
                  type="button"
                  data-filter="landscape"
                  className="filter-button border px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition hover:border-white hover:text-white"
                  aria-pressed="false"
                >
                  Landscape
                </button>
                <button
                  type="button"
                  data-filter="street"
                  className="filter-button border px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition hover:border-white hover:text-white"
                  aria-pressed="false"
                >
                  Street
                </button>
              </div>
            </div>
          </header>

          <GalleryGrid />
        </main>
      </div>

      <Lightbox />
      <PublicScripts />
    </>
  );
}
