import { build } from "esbuild";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
await mkdir("dist/app", { recursive: true });
await build({ entryPoints: ["src/app/main.ts"], bundle: true, format: "iife", platform: "browser", target: ["es2022"], outfile: "dist/app/app.js" });
await mkdir("dist/app/assets/fonts", { recursive: true });
for (const asset of ["mos-lockup-transparent-v2.svg", "fonts/Figtree-variable.woff2", "fonts/DM-Sans-variable.ttf", "fonts/Heebo-variable.ttf", "fonts/JetBrains-Mono-variable.ttf"]) await copyFile(`src/app/assets/${asset}`, `dist/app/assets/${asset}`);
for (const license of ["figtree-OFL.txt", "dmsans-OFL.txt", "heebo-OFL.txt", "jetbrainsmono-OFL.txt"]) await copyFile(`src/app/assets/fonts/${license}`, `dist/app/assets/fonts/${license}`);
await mkdir("public/assets/fonts", { recursive: true });
for (const asset of ["Figtree-variable.woff2", "DM-Sans-variable.ttf", "Heebo-variable.ttf", "JetBrains-Mono-variable.ttf", "figtree-OFL.txt", "dmsans-OFL.txt", "heebo-OFL.txt", "jetbrainsmono-OFL.txt"]) await copyFile(`src/app/assets/fonts/${asset}`, `public/assets/fonts/${asset}`);
await copyFile("src/app/assets/mos-lockup-transparent-v2.svg", "public/assets/mos-lockup-transparent-v2.svg");
await copyFile("src/app/styles.css", "dist/app/styles.css");
const template = await readFile("src/app/index.html", "utf8");
const css = await readFile("src/app/styles.css", "utf8");
const app = await readFile("dist/app/app.js", "utf8");
const b64 = async path => (await import("node:fs/promises")).readFile(path).then(buf => buf.toString("base64"));
const font = async (file, mime) => `url(data:${mime};base64,${await b64(`src/app/assets/fonts/${file}`)})`;
const fonts = [
  `@font-face{font-family:Figtree;src:${await font("Figtree-variable.woff2", "font/woff2")};font-weight:100 900;font-display:swap}`,
  `@font-face{font-family:"DM Sans";src:${await font("DM-Sans-variable.ttf", "font/ttf")};font-weight:100 900;font-display:swap}`,
  `@font-face{font-family:Heebo;src:${await font("Heebo-variable.ttf", "font/ttf")};font-weight:100 900;font-display:swap}`,
  `@font-face{font-family:"JetBrains Mono";src:${await font("JetBrains-Mono-variable.ttf", "font/ttf")};font-weight:100 900;font-display:swap}`,
].join("");
const lockup = `data:image/svg+xml;base64,${await b64("src/app/assets/mos-lockup-transparent-v2.svg")}`;
await writeFile("dist/app/index.html", template.replace("__MOS_FONTS__", fonts).replace("__MOS_CSS__", css).replace("__PARENT_LOCKUP__", lockup).replace("__MOS_SCRIPT__", () => app.replace(/<\/script/gi, "<\\/script")));
