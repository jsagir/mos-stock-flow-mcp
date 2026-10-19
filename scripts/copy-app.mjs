import { copyFile, mkdir, rm } from "node:fs/promises";
await rm("dist/app", { recursive: true, force: true });
await mkdir("dist/app", { recursive: true });
await mkdir("public/assets/fonts", { recursive: true });
for (const asset of ["Figtree-variable.woff2", "DM-Sans-variable.ttf", "Heebo-variable.ttf", "JetBrains-Mono-variable.ttf", "figtree-OFL.txt", "dmsans-OFL.txt", "heebo-OFL.txt", "jetbrainsmono-OFL.txt"]) await copyFile(`src/app/assets/fonts/${asset}`, `public/assets/fonts/${asset}`);
await copyFile("src/app/assets/mos-lockup-transparent-v2.svg", "public/assets/mos-lockup-transparent-v2.svg");
