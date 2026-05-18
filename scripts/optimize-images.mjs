import path from "node:path";
import { mkdir, rm } from "node:fs/promises";
import sharp from "sharp";

const outputDir = "assets/images/optimized";
const formats = [
    { extension: "webp", options: { quality: 72 } },
    { extension: "jpg", options: { quality: 78, mozjpeg: true } },
];

const sources = [
    "assets/images/source/resources/hero-mountain-portrait.jpg",
    "assets/images/source/resources/porsche-club-mockup.jpg",
    "assets/images/source/gallery/classic-car-warm-scene.jpg",
    "assets/images/source/gallery/low-angle-automotive.jpg",
    "assets/images/source/gallery/vintage-car-wood-detail.jpg",
    "assets/images/source/gallery/automotive-architecture.jpg",
    "assets/images/source/gallery/automotive-chrome-detail.jpg",
    "assets/images/source/gallery/street-passing-frame.jpg",
    "assets/images/source/gallery/street-quiet-corner.jpg",
    "assets/images/source/gallery/landscape-open-light.jpg",
    "assets/images/source/gallery/landscape-last-ridge.jpg",
];

function widthsForImage(width) {
    return [480, 768, 1200, 1600].filter((candidate) => candidate <= width);
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const source of sources) {
    const image = sharp(source);
    const metadata = await image.metadata();
    const basename = path.parse(source).name;
    const widths = widthsForImage(metadata.width);

    for (const width of widths) {
        for (const format of formats) {
            const target = path.join(outputDir, `${basename}-${width}.${format.extension}`);
            await sharp(source)
                .rotate()
                .resize({ width, withoutEnlargement: true })
                .toFormat(format.extension === "jpg" ? "jpeg" : format.extension, format.options)
                .toFile(target);
        }
    }
}
