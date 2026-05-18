import path from "node:path";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const outputDir = "assets/images/optimized";
const formats = [
    { extension: "webp", options: { quality: 72 } },
    { extension: "jpg", options: { quality: 78, mozjpeg: true } },
];

const sources = [
    "assets/images/source/resources/DSC6037.jpg",
    "assets/images/source/resources/mockup.jpg",
    "assets/images/source/gallery/000003530005.jpg",
    "assets/images/source/gallery/000003530008.jpg",
    "assets/images/source/gallery/000003530010.jpg",
    "assets/images/source/gallery/000003530023.jpg",
    "assets/images/source/gallery/000005180001.jpg",
    "assets/images/source/gallery/imm001_0A.jpg",
    "assets/images/source/gallery/imm004_3A.jpg",
    "assets/images/source/gallery/imm005_4A.jpg",
    "assets/images/source/gallery/imm009_9.jpg",
];

function widthsForImage(width) {
    return [480, 768, 1200, 1600].filter((candidate) => candidate <= width);
}

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
