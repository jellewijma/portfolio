import type { Metadata } from "next";
import { ArrowLinkContent, Footer, PublicScripts, SiteNav } from "../portfolio-content";

export const metadata: Metadata = {
  title: "Jelle Wijma | Projects",
  description: "Project work by Jelle Wijma, including web builds, visual systems, and photography-led digital experiences.",
};

export default function ProjectsPage() {
  return (
    <>
      <div id="page-shell">
        <SiteNav page="projects" />

        <main className="pt-[88px]">
          <header className="grid border-b border-[#ffffff26] xl:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-12 xl:border-r xl:border-[#ffffff26]">
              <p className="text-sm uppercase tracking-[0.32em] text-[#ffffff80]">Selected work</p>
              <h1 className="mt-8 text-5xl font-bold leading-none sm:text-7xl">Projects</h1>
            </div>
            <div className="flex flex-col justify-end border-t border-[#ffffff26] p-6 sm:p-12 xl:border-t-0">
              <p className="max-w-xl text-lg leading-8 text-[#ffffffb3]">
                Web builds and visual concepts with sharp structure, responsive layouts, and image-led direction.
              </p>
            </div>
          </header>

          <section className="border-b border-[#ffffff26]">
            <div className="grid xl:grid-cols-2">
              <article className="flex min-h-[70vh] flex-col justify-between border-b border-[#ffffff26] p-6 sm:p-12 xl:border-r">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-[#ffffff80]">Featured project</p>
                  <h2 id="featured-project-title" className="mt-8 text-5xl font-bold leading-none sm:text-6xl">
                    Porsche Club
                  </h2>
                  <p id="featured-project-description" className="mt-10 max-w-2xl text-lg leading-8 text-[#ffffffe6]">
                    A showcase concept for a premium automotive community. The site explores a sharp editorial style, event-focused content, and a visual system
                    that matches the energy of the brand.
                  </p>
                </div>
                <a
                  id="featured-project-link"
                  href="https://jellewijma.github.io/porsche-club"
                  className="mt-12 inline-flex h-14 w-14 items-center justify-center border border-white text-white transition hover:bg-white/[0.08] hover:text-white"
                  aria-label="Open Porsche Club project"
                >
                  <ArrowLinkContent iconWidth={28} iconHeight={20}>
                    <span className="sr-only">Open project</span>
                  </ArrowLinkContent>
                </a>
              </article>
              <div className="min-h-[70vh] border-b border-[#ffffff26]">
                <picture className="block h-full w-full">
                  <source
                    type="image/webp"
                    srcSet="/assets/images/optimized/porsche-club-mockup-480.webp 480w, /assets/images/optimized/porsche-club-mockup-768.webp 768w, /assets/images/optimized/porsche-club-mockup-1200.webp 1200w, /assets/images/optimized/porsche-club-mockup-1600.webp 1600w"
                    sizes="(min-width: 1280px) 50vw, 100vw"
                  />
                  <img
                    id="featured-project-image"
                    src="/assets/images/optimized/porsche-club-mockup-1200.jpg"
                    srcSet="/assets/images/optimized/porsche-club-mockup-480.jpg 480w, /assets/images/optimized/porsche-club-mockup-768.jpg 768w, /assets/images/optimized/porsche-club-mockup-1200.jpg 1200w, /assets/images/optimized/porsche-club-mockup-1600.jpg 1600w"
                    sizes="(min-width: 1280px) 50vw, 100vw"
                    width="5000"
                    height="2813"
                    alt="Porsche Club website mockup on a laptop"
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
            </div>
          </section>

          <section className="border-b border-[#ffffff26]">
            <div className="grid xl:grid-cols-[1.1fr_0.9fr]">
              <div className="border-b border-[#ffffff26] p-6 sm:p-12 xl:border-b-0 xl:border-r">
                <p className="text-sm uppercase tracking-[0.32em] text-[#ffffff80]">What I make</p>
                <h2 className="mt-8 text-5xl font-bold leading-none sm:text-6xl">Design-minded front-end work.</h2>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-1">
                <div className="border-b border-[#ffffff26] p-6 sm:border-r sm:p-10 xl:border-r-0">
                  <h3 className="text-xl font-semibold">Responsive websites</h3>
                  <p className="mt-4 leading-7 text-[#ffffffb3]">Static sites, landing pages, and portfolio experiences that stay fast and easy to maintain.</p>
                </div>
                <div className="border-b border-[#ffffff26] p-6 sm:p-10">
                  <h3 className="text-xl font-semibold">Interface polish</h3>
                  <p className="mt-4 leading-7 text-[#ffffffb3]">Strong spacing, clear hierarchy, keyboard-friendly controls, and careful mobile behavior.</p>
                </div>
                <div className="p-6 sm:col-span-2 sm:p-10 xl:col-span-1">
                  <h3 className="text-xl font-semibold">Photography direction</h3>
                  <p className="mt-4 leading-7 text-[#ffffffb3]">
                    Image selection, visual rhythm, and gallery layouts for automotive, street, and landscape work.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
      <PublicScripts />
    </>
  );
}
