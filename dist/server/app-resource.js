import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "../app/index.html"), "utf8");
let bundle = "";
let css = "";
try {
    bundle = readFileSync(join(here, "../app/app.js"), "utf8");
}
catch { /* `npm run build` creates the self-contained App bundle. */ }
try {
    css = readFileSync(join(here, "../app/styles.css"), "utf8");
}
catch { /* Build creates the copied stylesheet. */ }
const assetPath = join(here, "../app/assets");
const asData = (path, mime) => `url(data:${mime};base64,${readFileSync(path).toString("base64")})`;
const fonts = [
    `@font-face{font-family:Figtree;src:${asData(join(assetPath, "fonts/Figtree-variable.woff2"), "font/woff2")};font-weight:100 900;font-display:swap}`,
    `@font-face{font-family:"DM Sans";src:${asData(join(assetPath, "fonts/DM-Sans-variable.ttf"), "font/ttf")};font-weight:100 900;font-display:swap}`,
    `@font-face{font-family:Heebo;src:${asData(join(assetPath, "fonts/Heebo-variable.ttf"), "font/ttf")};font-weight:100 900;font-display:swap}`,
    `@font-face{font-family:"JetBrains Mono";src:${asData(join(assetPath, "fonts/JetBrains-Mono-variable.ttf"), "font/ttf")};font-weight:100 900;font-display:swap}`,
].join("");
const lockup = `data:image/svg+xml;base64,${readFileSync(join(assetPath, "mos-lockup-transparent-v2.svg")).toString("base64")}`;
export const appHtml = html.replace("__MOS_FONTS__", fonts).replace("__MOS_CSS__", css).replace("__PARENT_LOCKUP__", lockup).replace("__MOS_SCRIPT__", () => bundle.replace(/<\/script/gi, "<\\/script"));
