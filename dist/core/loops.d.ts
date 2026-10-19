import type { Model } from "./model.js";
export interface FeedbackLoop {
    id: string;
    nodeIds: string[];
    label: string;
    kind: "reinforcing" | "balancing" | "unclassified";
}
/** Finds short simple cycles in the stated causal-link graph. This classifies signs only; it does not validate causation. */
export declare function findFeedbackLoops(model: Model, maxLoops?: number, maxLength?: number): FeedbackLoop[];
