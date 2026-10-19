import type { Model } from "./model.js";
export interface ValidationIssue {
    path: string;
    message: string;
}
export declare function validateModel(input: unknown): {
    ok: true;
    model: Model;
} | {
    ok: false;
    issues: ValidationIssue[];
};
