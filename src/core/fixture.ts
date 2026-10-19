import type { Model } from "./model.js";
export const fixture: Model = {
  schemaVersion: "1.1", id: "community-garden", title: "Community garden participation",
  boundary: "A neighborhood garden across one growing season", purpose: "Explore conditions that affect participation", timeHorizon: "One growing season",
  actors: [{ id: "volunteers", label: "Volunteers" }], levels: [{ id: "garden", label: "Garden" }],
  variables: [
    { id: "garden-quality", label: "Garden quality", description: "How useful and welcoming the shared space feels", evidence: "hypothesis" },
    { id: "volunteer-interest", label: "Volunteer interest", description: "People considering joining or returning", evidence: "hypothesis" },
  ],
  stocks: [{ id: "active-volunteers", label: "Active volunteers", unit: "people", value: null, levelId: "garden", evidence: "unknown" }, { id: "beds", label: "Available garden beds", unit: "beds", evidence: "reported" }],
  flows: [{ id: "joining", label: "People joining", toStockId: "active-volunteers", unit: "people/week", rate: null, evidence: "unknown", delay: "May lag outreach by several weeks" }, { id: "leaving", label: "People leaving", fromStockId: "active-volunteers", unit: "people/week", rate: null, evidence: "hypothesis" }],
  causalLinks: [
    { id: "care-link", fromId: "active-volunteers", toId: "beds", polarity: "positive", label: "Care may increase usable beds", evidence: "hypothesis" },
    { id: "volunteers-quality", fromId: "active-volunteers", toId: "garden-quality", polarity: "positive", label: "More care may improve the garden", evidence: "hypothesis" },
    { id: "quality-interest", fromId: "garden-quality", toId: "volunteer-interest", polarity: "positive", label: "A welcoming garden may draw people", evidence: "hypothesis" },
    { id: "interest-volunteers", fromId: "volunteer-interest", toId: "active-volunteers", polarity: "positive", label: "Interest may become participation", evidence: "hypothesis" },
  ],
  assumptions: [{ id: "assumption-season", text: "Seasonal availability affects participation.", status: "hypothesis" }], evidence: [], layout: { nodes: { "active-volunteers": { x: 220, y: 180 }, beds: { x: 820, y: 180 }, "garden-quality": { x: 820, y: 440 }, "volunteer-interest": { x: 220, y: 440 }, volunteers: { x: 220, y: 620 }, garden: { x: 820, y: 620 } } }
};
