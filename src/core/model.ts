export type EvidenceStatus = "observed" | "reported" | "inferred" | "hypothesis" | "unknown";
export type Polarity = "positive" | "negative" | "unknown";
export interface Actor { id: string; label: string; description?: string; }
/** A non-accumulating condition or factor, as used in causal-loop diagrams. */
export interface Variable { id: string; label: string; description?: string; unit?: string | null; value?: number | null; evidence: EvidenceStatus; }
export interface Level { id: string; label: string; parentId?: string | null; }
export interface Stock { id: string; label: string; description?: string; unit?: string | null; value?: number | null; levelId?: string | null; evidence: EvidenceStatus; }
export interface Flow { id: string; label: string; fromStockId?: string | null; toStockId?: string | null; unit?: string | null; rate?: number | null; evidence: EvidenceStatus; delay?: string | null; }
export interface CausalLink { id: string; fromId: string; toId: string; polarity: Polarity; label?: string; evidence: EvidenceStatus; delay?: string | null; }
export interface Note { id: string; text: string; status: EvidenceStatus; }
export interface Layout { nodes: Record<string, { x: number; y: number }>; }
export interface Model {
  schemaVersion: "1.0" | "1.1"; id: string; title: string; boundary: string; purpose: string;
  timeHorizon?: string | null; actors: Actor[]; levels: Level[]; stocks: Stock[]; flows: Flow[];
  /** Optional for backwards compatibility with existing 1.0 models. */
  variables?: Variable[];
  causalLinks: CausalLink[]; assumptions: Note[]; evidence: Note[]; layout: Layout;
  metadata?: Record<string, unknown>;
}
export const LIMITS = { bytes: 1_000_000, entities: 500, label: 500, text: 4_000 } as const;
