import type { Metadata } from "next";
import { ArrowLinkContent, Footer, PublicScripts, SelectedPhotoStrip, SiteNav } from "./portfolio-content";

export const metadata: Metadata = {
  title: "Jelle Wijma | Web Developer & Photographer",
  description:
    "Portfolio of Jelle Wijma, a web developer and photographer creating clean interfaces, visual systems, and image-led digital experiences.",
};

export default function HomePage() {
  return (
    <>
      <div id="page-shell">
        <SiteNav page="home" />

        <main className="pt-[88px]">
          <section id="about" className="grid min-h-[calc(100vh-88px)] border-b border-[#ffffff26] xl:grid-cols-2">
            <div className="order-2 flex flex-col justify-between border-t border-[#ffffff26] p-6 sm:p-12 xl:order-1 xl:border-r xl:border-t-0">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-[#ffffff80]">Web development / photography</p>
                <h1 className="mt-8 max-w-3xl text-5xl font-bold leading-none sm:text-7xl xl:text-8xl">
                  Digital work with a strong visual point of view.
                </h1>
                <p className="mt-10 max-w-2xl text-lg leading-8 text-[#ffffffe6] xl:text-xl">
                  I build clean, responsive websites and visual concepts with attention to layout, motion, usability, and the story an image can carry. This
                  portfolio brings my development work and photography into one place.
                </p>
              </div>
              <div className="mt-12 grid grid-cols-3 border border-[#ffffff26]">
                <div className="p-4 sm:p-6">
                  <p className="text-3xl font-bold">04</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#ffffff80]">Focus areas</p>
                </div>
                <div className="border-x border-[#ffffff26] p-4 sm:p-6">
                  <p className="text-3xl font-bold">09</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#ffffff80]">Gallery shots</p>
                </div>
                <div className="p-4 sm:p-6">
                  <p className="text-3xl font-bold">01</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#ffffff80]">Featured build</p>
                </div>
              </div>
            </div>
            <div className="order-1 min-h-[60vh] xl:order-2">
              <picture className="block h-full w-full">
                <source
                  type="image/webp"
                  srcSet="/assets/images/optimized/hero-mountain-portrait-480.webp 480w, /assets/images/optimized/hero-mountain-portrait-768.webp 768w, /assets/images/optimized/hero-mountain-portrait-1200.webp 1200w, /assets/images/optimized/hero-mountain-portrait-1600.webp 1600w"
                  sizes="(min-width: 1280px) 50vw, 100vw"
                />
                <img
                  id="home-image-hero"
                  src="/assets/images/optimized/hero-mountain-portrait-1200.jpg"
                  srcSet="/assets/images/optimized/hero-mountain-portrait-480.jpg 480w, /assets/images/optimized/hero-mountain-portrait-768.jpg 768w, /assets/images/optimized/hero-mountain-portrait-1200.jpg 1200w, /assets/images/optimized/hero-mountain-portrait-1600.jpg 1600w"
                  sizes="(min-width: 1280px) 50vw, 100vw"
                  width="2048"
                  height="1365"
                  alt="Jelle standing in front of mountains"
                  className="h-full w-full object-cover"
                  fetchPriority="high"
                />
              </picture>
            </div>
          </section>

          <SelectedPhotoStrip />

          <section id="projects" className="border-b border-[#ffffff26]">
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
                  className="mt-12 inline-flex h-14 w-14 items-center justify-center border border-[#ffffff40] text-[#ffffffcc] transition hover:border-white hover:text-white"
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

          <section className="grid border-b border-[#ffffff26] xl:grid-cols-4">
            <div className="border-b border-[#ffffff26] p-6 sm:p-12 xl:col-span-1 xl:border-b-0 xl:border-r">
              <h2 className="text-4xl font-bold leading-none">Photography</h2>
              <p className="mt-6 leading-7 text-[#ffffff99]">A compact archive of car, street, and landscape images.</p>
              <a
                href="/gallery"
                className="mt-8 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#ffffffcc] transition hover:text-white"
              >
                <ArrowLinkContent>Open gallery</ArrowLinkContent>
              </a>
            </div>
            <a
              href="/gallery?filter=car"
              data-home-image-slot="category-car"
              className="group flex min-h-[360px] flex-col justify-between bg-[url('/assets/images/optimized/low-angle-automotive-768.jpg')] bg-cover bg-center p-6 grayscale transition duration-300 hover:grayscale-0 sm:p-8 xl:border-r xl:border-[#ffffff26]"
            >
              <span className="text-5xl font-bold">CAR</span>
              <span className="flex items-end justify-between text-5xl font-bold">
                01
                <span className="opacity-0 transition group-hover:opacity-100">-&gt;</span>
              </span>
            </a>
            <a
              href="/gallery?filter=landscape"
              data-home-image-slot="category-landscape"
              className="group flex min-h-[360px] flex-col justify-between border-t border-[#ffffff26] bg-[url('/assets/images/optimized/landscape-open-light-768.jpg')] bg-cover bg-center p-6 grayscale transition duration-300 hover:grayscale-0 sm:p-8 xl:border-r xl:border-t-0"
            >
              <span className="text-5xl font-bold">LANDSCAPE</span>
              <span className="flex items-end justify-between text-5xl font-bold">
                02
                <span className="opacity-0 transition group-hover:opacity-100">-&gt;</span>
              </span>
            </a>
            <a
              href="/gallery?filter=street"
              data-home-image-slot="category-street"
              className="group flex min-h-[360px] flex-col justify-between border-t border-[#ffffff26] bg-[url('/assets/images/optimized/street-quiet-corner-768.jpg')] bg-cover bg-center p-6 grayscale transition duration-300 hover:grayscale-0 sm:p-8 xl:border-t-0"
            >
              <span className="text-5xl font-bold">STREET</span>
              <span className="flex items-end justify-between text-5xl font-bold">
                03
                <span className="opacity-0 transition group-hover:opacity-100">-&gt;</span>
              </span>
            </a>
          </section>
        </main>

        <Footer />
      </div>
      <PublicScripts />
    </>
  );
}
