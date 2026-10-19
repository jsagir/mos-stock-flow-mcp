import { build } from "esbuild";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = "vendor/systemicworks";
const output = "dist/app/systemicworks";
await mkdir(output, { recursive: true });
await cp(`${root}/pages/favicon.png`, `${output}/favicon.png`);
await build({
  entryPoints: [`${root}/src/index.ts`],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2022"],
  outfile: `${output}/main.js`,
});
await cp(`${root}/pages/assets`, `${output}/assets`, { recursive: true });
await mkdir(`${output}/assets/fonts`, { recursive: true });
for (const file of ["DM-Sans-variable.ttf", "Figtree-variable.woff2", "dmsans-OFL.txt", "figtree-OFL.txt"]) {
  await cp(`public/assets/fonts/${file}`, `${output}/assets/fonts/${file}`);
}
await cp("src/app/assets/mos-lockup-transparent-v2.svg", `${output}/assets/mos-lockup.svg`);

let html = await readFile(`${root}/pages/index.html`, "utf8");
html = html
  .replace(/\s*<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/g, "")
  .replace(/\s*<noscript><iframe src="https:\/\/www\.googletagmanager\.com[\s\S]*?<\/noscript>/g, "")
  .replace(/\s*<link href="https:\/\/fonts\.googleapis\.com\/icon\?family=Material\+Icons" rel="stylesheet">/g, "")
  .replace(/\s*<script>\s*if \('serviceWorker' in navigator\)[\s\S]*?<\/script>/g, "")
  .replace(/<img class="logo"[^>]*>/, '<img class="logo mos-logo" src="assets/mos-lockup.svg" alt="/m:os">')
  .replace(/<title>[^<]*<\/title>/, "<title>/m:os · SystemicWorks local editor</title>")
  .replace(/<meta[^>]+>/g, "")
  .replace(/<link rel="icon"[^>]*>/g, '<link rel="icon" type="image/png" href="favicon.png">')
  .replace("</head>", '<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="assets/mos-local.css"><meta http-equiv="Content-Security-Policy" content="default-src \'self\'; img-src \'self\' data: blob:; style-src \'self\' \'unsafe-inline\'; script-src \'self\' \'unsafe-inline\'; font-src \'self\' data:; connect-src \'none\'; object-src \'none\'; base-uri \'self\'; form-action \'none\'"></head>')
  .replace("</body>", '<script src="main.js" defer></script></body>');
await writeFile(`${output}/index.html`, html);

const mimeTypes = { ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf" };
const assetFiles = [];
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await collect(path);
    else assetFiles.push(path);
  }
}
await collect(`${output}/assets`);
const dataAssets = new Map();
for (const path of assetFiles) {
  const relative = path.slice(`${output}/`.length).replaceAll("\\", "/");
  const mime = mimeTypes[extname(path).toLowerCase()] ?? "application/octet-stream";
  dataAssets.set(relative, `data:${mime};base64,${(await readFile(path)).toString("base64")}`);
}
let mcpHtml = await readFile(`${output}/index.html`, "utf8");
mcpHtml = mcpHtml.replace('href="favicon.png"', `href="data:image/png;base64,${(await readFile(`${output}/favicon.png`)).toString("base64")}"`);
mcpHtml = mcpHtml.replace(/<img class="logo mos-logo"[^>]*>/, '<span class="logo mos-wordmark">/m:os</span>');
const stylesheetPaths = [...mcpHtml.matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>/g)].map(match => match[1]);
for (const path of stylesheetPaths) {
  const relative = path.replace(/^\.\//, "");
  let css = await readFile(`${output}/${relative}`, "utf8");
  css = css.replace(/url\(["']?(?:\.\/)?([^"')]+)["']?\)/g, (whole, asset) => `url("${dataAssets.get(asset.replace(/^\.\//, "assets/")) ?? dataAssets.get(asset) ?? asset}")`);
  mcpHtml = mcpHtml.replace(new RegExp(`<link[^>]+href="${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`), `<style>${css}</style>`);
}
mcpHtml = mcpHtml.replace(/<script src="main\.js" defer><\/script>/, `<script>${(await readFile(`${output}/main.js`, "utf8")).replace(/<\/script/gi, "<\\/script")}</script>`);
mcpHtml = mcpHtml.replace(/(?:\.\/)?assets\/([A-Za-z0-9_./-]+)/g, (whole, path) => dataAssets.get(`assets/${path}`) ?? whole);
await writeFile(`${output}/mcp-app.html`, mcpHtml);
