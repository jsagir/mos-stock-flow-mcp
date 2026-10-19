import { z } from "zod";
export declare const modelSchema: z.ZodObject<{
    schemaVersion: z.ZodEnum<{
        "1.0": "1.0";
        1.1: "1.1";
    }>;
    id: z.ZodString;
    title: z.ZodString;
    boundary: z.ZodString;
    purpose: z.ZodString;
    timeHorizon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    actors: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    levels: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    variables: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        value: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        evidence: z.ZodEnum<{
            observed: "observed";
            reported: "reported";
            inferred: "inferred";
            hypothesis: "hypothesis";
            unknown: "unknown";
        }>;
    }, z.core.$strip>>>;
    stocks: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        value: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        levelId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        evidence: z.ZodEnum<{
            observed: "observed";
            reported: "reported";
            inferred: "inferred";
            hypothesis: "hypothesis";
            unknown: "unknown";
        }>;
    }, z.core.$strip>>;
    flows: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        fromStockId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        toStockId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        unit: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        evidence: z.ZodEnum<{
            observed: "observed";
            reported: "reported";
            inferred: "inferred";
            hypothesis: "hypothesis";
            unknown: "unknown";
        }>;
        delay: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    causalLinks: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        fromId: z.ZodString;
        toId: z.ZodString;
        polarity: z.ZodEnum<{
            unknown: "unknown";
            positive: "positive";
            negative: "negative";
        }>;
        label: z.ZodOptional<z.ZodString>;
        evidence: z.ZodEnum<{
            observed: "observed";
            reported: "reported";
            inferred: "inferred";
            hypothesis: "hypothesis";
            unknown: "unknown";
        }>;
        delay: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    assumptions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        status: z.ZodEnum<{
            observed: "observed";
            reported: "reported";
            inferred: "inferred";
            hypothesis: "hypothesis";
            unknown: "unknown";
        }>;
    }, z.core.$strip>>;
    evidence: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        status: z.ZodEnum<{
            observed: "observed";
            reported: "reported";
            inferred: "inferred";
            hypothesis: "hypothesis";
            unknown: "unknown";
        }>;
    }, z.core.$strip>>;
    layout: z.ZodObject<{
        nodes: z.ZodRecord<z.ZodString, z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strict>;
