import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const entries = ["app", "assets/js", "index.html", "gallery.html", "admin.html"];
const supportedExtensions = new Set([".html", ".js", ".jsx", ".ts", ".tsx"]);
const refs = new Set();
const assetPattern = /\/assets\/[^\s"'`)<]+/g;

function extensionFor(file) {
    const index = file.lastIndexOf(".");
    return index >= 0 ? file.slice(index) : "";
}

function collectFiles(entry) {
    const stat = statSync(entry);

    if (stat.isFile()) {
        return supportedExtensions.has(extensionFor(entry)) ? [entry] : [];
    }

    if (!stat.isDirectory()) {
        return [];
    }

    return readdirSync(entry)
        .flatMap((child) => collectFiles(join(entry, child)));
}

for (const file of entries.flatMap(collectFiles)) {
    const source = readFileSync(file, "utf8");

    for (const match of source.matchAll(assetPattern)) {
        refs.add(match[0].replace(/[,\]]$/, ""));
    }
}

const missingRefs = Array.from(refs)
    .sort()
    .filter((ref) => !existsSync(ref.slice(1)));

if (missingRefs.length > 0) {
    console.error(`Missing assets:\n${missingRefs.join("\n")}`);
    process.exit(1);
}

console.log("All local asset references exist.");
