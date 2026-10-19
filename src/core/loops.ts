import type { CausalLink, Model } from "./model.js";

export interface FeedbackLoop {
  id: string;
  nodeIds: string[];
  label: string;
  kind: "reinforcing" | "balancing" | "unclassified";
}

/** Finds short simple cycles in the stated causal-link graph. This classifies signs only; it does not validate causation. */
export function findFeedbackLoops(model: Model, maxLoops = 32, maxLength = 12): FeedbackLoop[] {
  const nodes = [...model.stocks, ...(model.variables ?? []), ...model.actors, ...model.levels];
  const labels = new Map(nodes.map(node => [node.id, node.label]));
  const ids = [...labels.keys()].sort();
  const outgoing = new Map<string, CausalLink[]>();
  for (const link of model.causalLinks) outgoing.set(link.fromId, [...(outgoing.get(link.fromId) ?? []), link]);

  const loops: FeedbackLoop[] = [];
  let exploredLinks = 0;
  for (const start of ids) {
    const pathNodes = [start];
    const pathLinks: CausalLink[] = [];
    const walk = (current: string) => {
      if (loops.length >= maxLoops || pathNodes.length > maxLength) return;
      for (const link of outgoing.get(current) ?? []) {
        if (++exploredLinks > 25_000) return;
        if (link.toId === start) {
          const cycle = [...pathLinks, link];
          const signsKnown = cycle.every(item => item.polarity !== "unknown");
          const negatives = cycle.filter(item => item.polarity === "negative").length;
          loops.push({
            id: cycle.map(item => item.id).join("/"),
            nodeIds: [...pathNodes],
            label: [...pathNodes.map(id => labels.get(id) ?? id), labels.get(start) ?? start].join(" → "),
            kind: !signsKnown ? "unclassified" : negatives % 2 ? "balancing" : "reinforcing",
          });
          if (loops.length >= maxLoops) return;
        } else if (link.toId >= start && !pathNodes.includes(link.toId) && pathNodes.length < maxLength) {
          pathNodes.push(link.toId);
          pathLinks.push(link);
          walk(link.toId);
          pathLinks.pop();
          pathNodes.pop();
        }
      }
    };
    walk(start);
    if (loops.length >= maxLoops) break;
  }
  return loops;
}
