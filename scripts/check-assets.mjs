import { existsSync, readFileSync } from "node:fs";

const files = ["index.html", "gallery.html", "admin.html"];
const refs = new Set();
const assetPattern = /(?:src|href|data-image)="([^"]+)"|srcset="([^"]+)"|data-srcset="([^"]+)"|url\('([^']+)'\)/g;

for (const file of files) {
    const html = readFileSync(file, "utf8");

    for (const match of html.matchAll(assetPattern)) {
        const value = match[1] || match[2] || match[3] || match[4];

        for (const srcsetPart of value.split(",")) {
            const ref = srcsetPart.trim().split(/\s+/)[0];

            if (ref.startsWith("/") && !ref.startsWith("/index.html") && !ref.startsWith("/gallery.html")) {
                refs.add(ref.slice(1));
            }
        }
    }
}

const missingRefs = Array.from(refs).filter((ref) => !existsSync(ref));

if (missingRefs.length > 0) {
    console.error(`Missing assets:\n${missingRefs.join("\n")}`);
    process.exit(1);
}

console.log("All local asset references exist.");
