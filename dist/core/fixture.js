export const fixture = {
    schemaVersion: "1.0", id: "community-garden", title: "Community garden participation",
    boundary: "A neighborhood garden across one growing season", purpose: "Explore conditions that affect participation", timeHorizon: "One growing season",
    actors: [{ id: "volunteers", label: "Volunteers" }], levels: [{ id: "garden", label: "Garden" }],
    stocks: [{ id: "active-volunteers", label: "Active volunteers", unit: "people", value: null, levelId: "garden", evidence: "unknown" }, { id: "beds", label: "Available garden beds", unit: "beds", evidence: "reported" }],
    flows: [{ id: "joining", label: "People joining", toStockId: "active-volunteers", unit: "people/week", rate: null, evidence: "unknown", delay: "May lag outreach by several weeks" }, { id: "leaving", label: "People leaving", fromStockId: "active-volunteers", unit: "people/week", rate: null, evidence: "hypothesis" }],
    causalLinks: [{ id: "care-link", fromId: "active-volunteers", toId: "beds", polarity: "positive", label: "Care may increase usable beds", evidence: "hypothesis" }],
    assumptions: [{ id: "assumption-season", text: "Seasonal availability affects participation.", status: "hypothesis" }], evidence: [], layout: { nodes: { "active-volunteers": { x: 240, y: 180 }, beds: { x: 540, y: 180 } } }
};
