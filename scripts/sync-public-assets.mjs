import { cp, mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";

const targets = [
    ["assets/css", "public/assets/css"],
    ["assets/icons", "public/assets/icons"],
    ["assets/js", "public/assets/js"],
    ["assets/images/optimized", "public/assets/images/optimized"],
];

for (const [source, destination] of targets) {
    await rm(destination, { recursive: true, force: true });
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination, { recursive: true });
}

console.log("Public assets synced.");
