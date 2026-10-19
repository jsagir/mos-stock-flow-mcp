import { z } from "zod";
import { LIMITS } from "./model.js";
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/, "Use 1-80 letters, numbers, dot, underscore, colon or dash.");
const label = z.string().trim().min(1).max(LIMITS.label);
const evidenceStatus = z.enum(["observed", "reported", "inferred", "hypothesis", "unknown"]);
const nullableText = z.string().max(LIMITS.text).nullable().optional();
const actor = z.object({ id, label, description: nullableText });
const level = z.object({ id, label, parentId: id.nullable().optional() });
const stock = z.object({ id, label, description: nullableText, unit: nullableText, value: z.number().finite().nullable().optional(), levelId: id.nullable().optional(), evidence: evidenceStatus });
const flow = z.object({ id, label, fromStockId: id.nullable().optional(), toStockId: id.nullable().optional(), unit: nullableText, rate: z.number().finite().nullable().optional(), evidence: evidenceStatus, delay: nullableText });
const causalLink = z.object({ id, fromId: id, toId: id, polarity: z.enum(["positive", "negative", "unknown"]), label: z.string().max(LIMITS.label).optional(), evidence: evidenceStatus, delay: nullableText });
const note = z.object({ id, text: z.string().max(LIMITS.text), status: evidenceStatus });
export const modelSchema = z.object({
  schemaVersion: z.literal("1.0"), id, title: label, boundary: z.string().max(LIMITS.text), purpose: z.string().max(LIMITS.text),
  timeHorizon: nullableText, actors: z.array(actor).max(LIMITS.entities), levels: z.array(level).max(LIMITS.entities),
  stocks: z.array(stock).max(LIMITS.entities), flows: z.array(flow).max(LIMITS.entities), causalLinks: z.array(causalLink).max(LIMITS.entities),
  assumptions: z.array(note).max(LIMITS.entities), evidence: z.array(note).max(LIMITS.entities),
  layout: z.object({ nodes: z.record(id, z.object({ x: z.number().finite(), y: z.number().finite() })) }),
  metadata: z.record(z.string(), z.unknown()).optional()
}).strict();
