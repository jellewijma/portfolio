import Script from "next/script";

type NavPage = "home" | "gallery";

type GalleryPhoto = {
  title: string;
  category: "car" | "landscape" | "street";
  categoryLabel: string;
  thumbSrc: string;
  fullSrc: string;
  srcSet: string;
  dataSrcSet: string;
  sizes: string;
  width: number;
  height: number;
  alt: string;
  className: string;
};

const galleryPhotos: GalleryPhoto[] = [
  {
    title: "Vrolijke Drukte",
    category: "car",
    categoryLabel: "Car",
    thumbSrc: "/assets/images/optimized/classic-car-warm-scene-480.jpg",
    fullSrc: "/assets/images/optimized/classic-car-warm-scene-1200.jpg",
    srcSet:
      "/assets/images/optimized/classic-car-warm-scene-480.jpg 480w, /assets/images/optimized/classic-car-warm-scene-768.jpg 768w, /assets/images/optimized/classic-car-warm-scene-1200.jpg 1200w",
    dataSrcSet:
      "/assets/images/optimized/classic-car-warm-scene-480.jpg 480w, /assets/images/optimized/classic-car-warm-scene-768.jpg 768w, /assets/images/optimized/classic-car-warm-scene-1200.jpg 1200w, /assets/images/optimized/classic-car-warm-scene-1600.jpg 1600w",
    sizes: "(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw",
    width: 2075,
    height: 3130,
    alt: "Classic car scene with warm color",
    className: "gallery-item group relative aspect-square overflow-hidden border-b border-[#ffffff26] text-left sm:border-r",
  },
  {
    title: "Stoer Chic",
    category: "car",
    categoryLabel: "Car",
    thumbSrc: "/assets/images/optimized/low-angle-automotive-480.jpg",
    fullSrc: "/assets/images/optimized/low-angle-automotive-1200.jpg",
    srcSet:
      "/assets/images/optimized/low-angle-automotive-480.jpg 480w, /assets/images/optimized/low-angle-automotive-768.jpg 768w, /assets/images/optimized/low-angle-automotive-1200.jpg 1200w",
    dataSrcSet:
      "/assets/images/optimized/low-angle-automotive-480.jpg 480w, /assets/images/optimized/low-angle-automotive-768.jpg 768w, /assets/images/optimized/low-angle-automotive-1200.jpg 1200w, /assets/images/optimized/low-angle-automotive-1600.jpg 1600w",
    sizes: "(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw",
    width: 2075,
    height: 3130,
    alt: "Low angle automotive photograph",
    className: "gallery-item group relative aspect-square overflow-hidden border-b border-[#ffffff26] text-left xl:border-r",
  },
  {
    title: "Hout Oud",
    category: "car",
    categoryLabel: "Car",
    thumbSrc: "/assets/images/optimized/vintage-car-wood-detail-480.jpg",
    fullSrc: "/assets/images/optimized/vintage-car-wood-detail-1200.jpg",
    srcSet:
      "/assets/images/optimized/vintage-car-wood-detail-480.jpg 480w, /assets/images/optimized/vintage-car-wood-detail-768.jpg 768w, /assets/images/optimized/vintage-car-wood-detail-1200.jpg 1200w",
    dataSrcSet:
      "/assets/images/optimized/vintage-car-wood-detail-480.jpg 480w, /assets/images/optimized/vintage-car-wood-detail-768.jpg 768w, /assets/images/optimized/vintage-car-wood-detail-1200.jpg 1200w, /assets/images/optimized/vintage-car-wood-detail-1600.jpg 1600w",
    sizes: "(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw",
    width: 2075,
    height: 3130,
    alt: "Vintage automotive detail near wood textures",
    className: "gallery-item group relative aspect-square overflow-hidden border-b border-[#ffffff26] text-left sm:border-r xl:border-r-0",
  },
  {
    title: "Helder Gebouw",
    category: "car",
    categoryLabel: "Car",
    thumbSrc: "/assets/images/optimized/automotive-architecture-480.jpg",
    fullSrc: "/assets/images/optimized/automotive-architecture-1200.jpg",
    srcSet:
      "/assets/images/optimized/automotive-architecture-480.jpg 480w, /assets/images/optimized/automotive-architecture-768.jpg 768w, /assets/images/optimized/automotive-architecture-1200.jpg 1200w",
    dataSrcSet:
      "/assets/images/optimized/automotive-architecture-480.jpg 480w, /assets/images/optimized/automotive-architecture-768.jpg 768w, /assets/images/optimized/automotive-architecture-1200.jpg 1200w, /assets/images/optimized/automotive-architecture-1600.jpg 1600w",
    sizes: "(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw",
    width: 2075,
    height: 3130,
    alt: "Automotive photograph near modern architecture",
    className: "gallery-item group relative aspect-square overflow-hidden border-b border-[#ffffff26] text-left xl:border-r",
  },
  {
    title: "Chrome Line",
    category: "car",
    categoryLabel: "Car",
    thumbSrc: "/assets/images/optimized/automotive-chrome-detail-480.jpg",
    fullSrc: "/assets/images/optimized/automotive-chrome-detail-1200.jpg",
    srcSet:
      "/assets/images/optimized/automotive-chrome-detail-480.jpg 480w, /assets/images/optimized/automotive-chrome-detail-768.jpg 768w, /assets/images/optimized/automotive-chrome-detail-1200.jpg 1200w",
    dataSrcSet:
      "/assets/images/optimized/automotive-chrome-detail-480.jpg 480w, /assets/images/optimized/automotive-chrome-detail-768.jpg 768w, /assets/images/optimized/automotive-chrome-detail-1200.jpg 1200w, /assets/images/optimized/automotive-chrome-detail-1600.jpg 1600w",
    sizes: "(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw",
    width: 2075,
    height: 3130,
    alt: "Automotive chrome detail",
    className: "gallery-item group relative aspect-square overflow-hidden border-b border-[#ffffff26] text-left sm:border-r",
  },
  {
    title: "Passing Frame",
    category: "street",
    categoryLabel: "Street",
    thumbSrc: "/assets/images/optimized/street-passing-frame-480.jpg",
    fullSrc: "/assets/images/optimized/street-passing-frame-1200.jpg",
    srcSet:
      "/assets/images/optimized/street-passing-frame-480.jpg 480w, /assets/images/optimized/street-passing-frame-768.jpg 768w, /assets/images/optimized/street-passing-frame-1200.jpg 1200w",
    dataSrcSet:
      "/assets/images/optimized/street-passing-frame-480.jpg 480w, /assets/images/optimized/street-passing-frame-768.jpg 768w, /assets/images/optimized/street-passing-frame-1200.jpg 1200w",
    sizes: "(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw",
    width: 1536,
    height: 1024,
    alt: "Street photograph captured on film",
    className: "gallery-item group relative aspect-square overflow-hidden border-b border-[#ffffff26] text-left",
  },
  {
    title: "Quiet Corner",
    category: "street",
    categoryLabel: "Street",
    thumbSrc: "/assets/images/optimized/street-quiet-corner-480.jpg",
    fullSrc: "/assets/images/optimized/street-quiet-corner-1200.jpg",
    srcSet:
      "/assets/images/optimized/street-quiet-corner-480.jpg 480w, /assets/images/optimized/street-quiet-corner-768.jpg 768w, /assets/images/optimized/street-quiet-corner-1200.jpg 1200w",
    dataSrcSet:
      "/assets/images/optimized/street-quiet-corner-480.jpg 480w, /assets/images/optimized/street-quiet-corner-768.jpg 768w, /assets/images/optimized/street-quiet-corner-1200.jpg 1200w",
    sizes: "(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw",
    width: 1536,
    height: 1024,
    alt: "Moody street scene",
    className: "gallery-item group relative aspect-square overflow-hidden border-b border-[#ffffff26] text-left sm:border-r xl:border-r",
  },
  {
    title: "Open Light",
    category: "landscape",
    categoryLabel: "Landscape",
    thumbSrc: "/assets/images/optimized/landscape-open-light-480.jpg",
    fullSrc: "/assets/images/optimized/landscape-open-light-1200.jpg",
    srcSet:
      "/assets/images/optimized/landscape-open-light-480.jpg 480w, /assets/images/optimized/landscape-open-light-768.jpg 768w, /assets/images/optimized/landscape-open-light-1200.jpg 1200w",
    dataSrcSet:
      "/assets/images/optimized/landscape-open-light-480.jpg 480w, /assets/images/optimized/landscape-open-light-768.jpg 768w, /assets/images/optimized/landscape-open-light-1200.jpg 1200w",
    sizes: "(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw",
    width: 1536,
    height: 1024,
    alt: "High contrast landscape image",
    className: "gallery-item group relative aspect-square overflow-hidden border-b border-[#ffffff26] text-left",
  },
  {
    title: "Last Ridge",
    category: "landscape",
    categoryLabel: "Landscape",
    thumbSrc: "/assets/images/optimized/landscape-last-ridge-480.jpg",
    fullSrc: "/assets/images/optimized/landscape-last-ridge-768.jpg",
    srcSet: "/assets/images/optimized/landscape-last-ridge-480.jpg 480w, /assets/images/optimized/landscape-last-ridge-768.jpg 768w",
    dataSrcSet: "/assets/images/optimized/landscape-last-ridge-480.jpg 480w, /assets/images/optimized/landscape-last-ridge-768.jpg 768w",
    sizes: "(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw",
    width: 1024,
    height: 1536,
    alt: "Landscape photograph with a distant ridge",
    className: "gallery-item group relative aspect-square overflow-hidden border-b border-[#ffffff26] text-left sm:border-r xl:border-r-0",
  },
];

function ArrowIcon({ width = 22, height = 16 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 -4.5 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polygon
        fill="currentColor"
        points="20 5.26683 14.343 0 12.929 1.21678 16.172 4.2264 0 4.2264 0 6.18481 16.172 6.18481 12.929 9.53046 14.343 11"
      />
    </svg>
  );
}

export function PublicScripts() {
  return (
    <>
      <Script src="/assets/js/runtime-config.js" strategy="afterInteractive" />
      <Script src="/assets/js/main.js" strategy="afterInteractive" />
    </>
  );
}

export function SiteNav({ page }: { page: NavPage }) {
  const homeHref = "/";
  const projectsHref = page === "home" ? "#projects" : "/#projects";
  const aboutHref = page === "home" ? "#about" : "/#about";

  return (
    <nav className="fixed inset-x-0 top-0 z-30 border-b border-[#ffffff26] bg-black/70 text-white backdrop-blur-lg">
      <div className="flex h-[88px] items-center justify-between">
        <a
          href={homeHref}
          className="flex h-full w-1/2 items-center border-r border-[#ffffff26] px-6 text-base font-bold tracking-[0.08em] sm:px-12 xl:w-1/4"
        >
          JelleWijma
        </a>
        <button
          type="button"
          id="mobile-menu-button"
          className="flex h-full w-[88px] items-center justify-center border-l border-[#ffffff26] xl:hidden"
          aria-controls="site-menu"
          aria-expanded="false"
          aria-label="Open navigation"
        >
          <span className="sr-only">Open navigation</span>
          <svg width="28" height="28" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 21H60M12 36H60M12 51H60" stroke="white" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div
          id="site-menu"
          className="hidden absolute left-0 top-[88px] w-screen border-b border-[#ffffff26] bg-black/90 backdrop-blur-lg xl:static xl:flex xl:h-full xl:w-3/4 xl:border-b-0 xl:bg-transparent xl:backdrop-blur-0"
        >
          <a
            href={projectsHref}
            className="flex h-[72px] flex-1 items-center border-b border-[#ffffff26] px-6 text-sm font-medium text-[#ffffff99] transition hover:text-white sm:px-12 xl:h-full xl:border-b-0 xl:border-r"
          >
            Projects
          </a>
          <a
            href={aboutHref}
            className="flex h-[72px] flex-1 items-center border-b border-[#ffffff26] px-6 text-sm font-medium text-[#ffffff99] transition hover:text-white sm:px-12 xl:h-full xl:border-b-0 xl:border-r"
          >
            About
          </a>
          <a
            href="/gallery"
            className={`flex h-[72px] flex-1 items-center px-6 text-sm font-medium transition hover:text-white sm:px-12 xl:h-full ${
              page === "gallery" ? "text-white" : "text-[#ffffff99]"
            }`}
          >
            Gallery
          </a>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="grid border-b border-[#ffffff26] xl:grid-cols-2">
      <div className="border-b border-[#ffffff26] p-6 sm:p-12 xl:border-b-0 xl:border-r">
        <p className="text-sm uppercase tracking-[0.32em] text-[#ffffff80]">Contact</p>
        <h2 className="mt-8 text-4xl font-bold leading-none sm:text-6xl">Have a project in mind?</h2>
      </div>
      <div className="flex flex-col justify-between p-6 sm:p-12">
        <p className="max-w-xl text-lg leading-8 text-[#ffffffb3]">
          I am open to small web builds, visual concepts, and photography-led portfolio work.
        </p>
        <a
          href="https://github.com/jellewijma"
          className="mt-10 inline-flex w-fit border border-[#ffffff40] px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#ffffffcc] transition hover:border-white hover:text-white"
        >
          github.com/jellewijma
        </a>
      </div>
    </footer>
  );
}

export function SelectedPhotoStrip() {
  const selected = [
    {
      slot: "selected-1",
      href: "/gallery",
      label: "Car work",
      src: "/assets/images/optimized/classic-car-warm-scene-480.jpg",
      srcSet:
        "/assets/images/optimized/classic-car-warm-scene-480.jpg 480w, /assets/images/optimized/classic-car-warm-scene-768.jpg 768w, /assets/images/optimized/classic-car-warm-scene-1200.jpg 1200w, /assets/images/optimized/classic-car-warm-scene-1600.jpg 1600w",
      width: 2075,
      height: 3130,
      alt: "Classic car detail photographed in warm light",
      className: "group relative aspect-square overflow-hidden border-r border-[#ffffff26]",
    },
    {
      slot: "selected-2",
      href: "/gallery",
      label: "Automotive",
      src: "/assets/images/optimized/low-angle-automotive-480.jpg",
      srcSet:
        "/assets/images/optimized/low-angle-automotive-480.jpg 480w, /assets/images/optimized/low-angle-automotive-768.jpg 768w, /assets/images/optimized/low-angle-automotive-1200.jpg 1200w, /assets/images/optimized/low-angle-automotive-1600.jpg 1600w",
      width: 2075,
      height: 3130,
      alt: "Car photographed from a low angle",
      className: "group relative aspect-square overflow-hidden border-r border-[#ffffff26]",
    },
    {
      slot: "selected-3",
      href: "/gallery",
      label: "Street",
      src: "/assets/images/optimized/street-quiet-corner-480.jpg",
      srcSet:
        "/assets/images/optimized/street-quiet-corner-480.jpg 480w, /assets/images/optimized/street-quiet-corner-768.jpg 768w, /assets/images/optimized/street-quiet-corner-1200.jpg 1200w",
      width: 1536,
      height: 1024,
      alt: "Street scene captured on film",
      className: "group relative aspect-square overflow-hidden border-r border-[#ffffff26]",
    },
    {
      slot: "selected-4",
      href: "/gallery",
      label: "Landscape",
      src: "/assets/images/optimized/landscape-open-light-480.jpg",
      srcSet:
        "/assets/images/optimized/landscape-open-light-480.jpg 480w, /assets/images/optimized/landscape-open-light-768.jpg 768w, /assets/images/optimized/landscape-open-light-1200.jpg 1200w",
      width: 1536,
      height: 1024,
      alt: "Landscape photograph with strong contrast",
      className: "group relative aspect-square overflow-hidden",
    },
  ];

  return (
    <section aria-label="Selected photography" className="grid grid-cols-2 border-b border-[#ffffff26] md:grid-cols-4">
      {selected.map((item) => (
        <a key={item.slot} href={item.href} data-home-image-slot={item.slot} className={item.className}>
          <img
            src={item.src}
            srcSet={item.srcSet}
            sizes="(min-width: 768px) 25vw, 50vw"
            width={item.width}
            height={item.height}
            alt={item.alt}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-sm font-semibold opacity-0 transition group-hover:opacity-100 group-focus:opacity-100">
            {item.label}
          </span>
        </a>
      ))}
    </section>
  );
}

export function GalleryGrid() {
  return (
    <section id="gallery-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" aria-label="Photography grid">
      {galleryPhotos.map((photo) => (
        <button
          key={photo.title}
          type="button"
          data-category={photo.category}
          data-image={photo.fullSrc}
          data-srcset={photo.dataSrcSet}
          data-title={photo.title}
          className={photo.className}
        >
          <img
            src={photo.thumbSrc}
            srcSet={photo.srcSet}
            sizes={photo.sizes}
            width={photo.width}
            height={photo.height}
            alt={photo.alt}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5">
            <span className="block text-sm uppercase tracking-[0.24em] text-[#ffffff99]">{photo.categoryLabel}</span>
            <span className="mt-2 block text-2xl font-bold">{photo.title}</span>
          </span>
        </button>
      ))}
    </section>
  );
}

export function Lightbox() {
  return (
    <div id="lightbox" className="fixed inset-0 z-40 hidden bg-black/90 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="lightbox-title">
      <button
        type="button"
        id="lightbox-close"
        className="absolute right-0 top-0 z-10 flex h-[88px] w-[88px] items-center justify-center border-b border-l border-[#ffffff26] text-3xl leading-none"
        aria-label="Close image"
      >
        &times;
      </button>
      <div className="flex min-h-screen flex-col justify-center p-4 sm:p-10">
        <img
          id="lightbox-image"
          src="/assets/images/optimized/classic-car-warm-scene-1200.jpg"
          alt=""
          width="2075"
          height="3130"
          className="max-h-[78vh] w-full object-contain"
        />
        <div className="mx-auto mt-6 flex w-full max-w-5xl items-center justify-between border-t border-[#ffffff26] pt-4">
          <h2 id="lightbox-title" className="text-2xl font-bold">
            Image title
          </h2>
          <p id="lightbox-category" className="text-sm uppercase tracking-[0.24em] text-[#ffffff99]">
            Category
          </p>
        </div>
      </div>
    </div>
  );
}

export function ArrowLinkContent({ children, iconWidth = 22, iconHeight = 16 }: { children: React.ReactNode; iconWidth?: number; iconHeight?: number }) {
  return (
    <>
      {children}
      <ArrowIcon width={iconWidth} height={iconHeight} />
    </>
  );
}
