import type { Metadata } from "next";
import { Footer, PublicScripts, SiteNav } from "../portfolio-content";

export const metadata: Metadata = {
  title: "Jelle Wijma | About",
  description: "About Jelle Wijma, a web developer and photographer focused on clean interfaces and image-led digital work.",
};

export default function AboutPage() {
  return (
    <>
      <div id="page-shell">
        <SiteNav page="about" />

        <main className="pt-[88px]">
          <section className="grid min-h-[calc(100vh-88px)] border-b border-[#ffffff26] xl:grid-cols-2">
            <div className="order-2 flex flex-col justify-center border-t border-[#ffffff26] p-6 sm:p-12 xl:order-1 xl:border-r xl:border-t-0">
              <p className="text-sm uppercase tracking-[0.32em] text-[#ffffff80]">About</p>
              <h1 className="mt-8 max-w-3xl text-5xl font-bold leading-none sm:text-7xl xl:text-8xl">
                Digital work with a strong visual point of view.
              </h1>
              <p className="mt-10 max-w-2xl text-lg leading-8 text-[#ffffffe6] xl:text-xl">
                I build clean, responsive websites and visual concepts with attention to layout, motion, usability, and the story an image can carry. This
                portfolio brings my development work and photography into one place.
              </p>
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

          <section className="border-b border-[#ffffff26]">
            <div className="grid xl:grid-cols-[0.8fr_1.2fr]">
              <div className="border-b border-[#ffffff26] p-6 sm:p-12 xl:border-b-0 xl:border-r">
                <p className="text-sm uppercase tracking-[0.32em] text-[#ffffff80]">Focus</p>
                <h2 className="mt-8 text-5xl font-bold leading-none sm:text-6xl">Small details, clear systems, strong images.</h2>
              </div>
              <div className="grid sm:grid-cols-3">
                <div className="border-b border-[#ffffff26] p-6 sm:border-r sm:p-10">
                  <h3 className="text-xl font-semibold">Front-end structure</h3>
                  <p className="mt-4 leading-7 text-[#ffffffb3]">Layouts and components that stay readable, responsive, and easy to evolve.</p>
                </div>
                <div className="border-b border-[#ffffff26] p-6 sm:border-r sm:p-10">
                  <h3 className="text-xl font-semibold">Visual direction</h3>
                  <p className="mt-4 leading-7 text-[#ffffffb3]">Spacing, contrast, type, and motion choices that give a page a deliberate rhythm.</p>
                </div>
                <div className="border-b border-[#ffffff26] p-6 sm:p-10">
                  <h3 className="text-xl font-semibold">Photography</h3>
                  <p className="mt-4 leading-7 text-[#ffffffb3]">Automotive, street, and landscape images shaped into fast, focused web experiences.</p>
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
