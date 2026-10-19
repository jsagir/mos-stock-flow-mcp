import type { Model } from "./model.js";
/** Conventional system-dynamics notation: stocks are boxes, material flows are pipes with valves, influences are dashed arrows. */
export declare function renderDiagram(model: Model, simulatedValues?: Record<string, number>): {
    viewBox: string;
    width: number;
    height: number;
    markup: string;
};
