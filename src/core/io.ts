import { LIMITS, type Model } from "./model.js";
import { validateModel } from "./validate.js";
export function parseModel(text: string): Model {
  if (Buffer.byteLength(text, "utf8") > LIMITS.bytes) throw new Error(`Model exceeds ${LIMITS.bytes} bytes.`);
  let data: unknown; try { data = JSON.parse(text); } catch { throw new Error("Input is not valid JSON."); }
  const result = validateModel(data); if (!result.ok) throw new Error(result.issues.map(x => `${x.path || "model"}: ${x.message}`).join("\n"));
  return result.model;
}
export function serializeModel(model: Model): string { return `${JSON.stringify(model, null, 2)}\n`; }
