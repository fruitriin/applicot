import type { DataId } from "../types/index.js";

/**
 * Resolves a DataId to a file path relative to the novel root.
 *
 * File placement conventions (from planning_doc.md section 1.2):
 * - HO-PUB → handouts/public/{name}.md
 * - HO-PRV-{id} → handouts/private/{id}.md
 * - HO-GM → handouts/gm/ (scenario.md, triggers.md, endings.md)
 * - ST-CHR-{id} → state/characters/{id}.json
 * - ST-ORG-{id} → state/organizations/{id}.json
 * - ST-NAT-{id}-{layer} → state/nations/{id}/{layer}.json
 * - ST-ENV → state/environment.json
 * - ST-REL → state/relationships.json
 * - TRK-FSH → state/foreshadowing.json
 * - TRK-TEN → state/tension_curve.json
 * - TRK-TML → state/timeline.json
 * - TRK-CSQ → campaign/consequences.md
 * - TRK-ARC-{id} → campaign/arcs/{id}.md
 * - OUT-SCN-{cycle}-{scene} → scenes/cycle_{cycle}/scene_{scene}.md
 * - EVL-{type} → evaluation/{type}.json
 * - EVL-RPT → evaluation/report.md
 * - RCL-{actor}-{layer} → recall/{actor}/{layer}.json
 * - META-CFG → meta/config.json
 * - META-LOG → meta/session_log.md
 */
export function resolveDataPath(dataId: DataId): string {
  // HO-PUB-{name}
  if (dataId.startsWith("HO-PUB-")) {
    const name = dataId.slice("HO-PUB-".length);
    return `handouts/public/${name}.md`;
  }
  if (dataId === "HO-PUB") {
    return "handouts/public";
  }

  // HO-PRV-{id}
  if (dataId.startsWith("HO-PRV-")) {
    const id = dataId.slice("HO-PRV-".length);
    return `handouts/private/${id}.md`;
  }

  // HO-GM-{subfile}
  if (dataId.startsWith("HO-GM-")) {
    const sub = dataId.slice("HO-GM-".length);
    return `handouts/gm/${sub}.md`;
  }
  if (dataId === "HO-GM") {
    return "handouts/gm";
  }

  // ST-CHR (directory listing) or ST-CHR-{id}
  if (dataId === "ST-CHR") return "state/characters";
  if (dataId.startsWith("ST-CHR-")) {
    const id = dataId.slice("ST-CHR-".length);
    return `state/characters/${id}.json`;
  }

  // ST-ORG (directory listing) or ST-ORG-{id}
  if (dataId === "ST-ORG") return "state/organizations";
  if (dataId.startsWith("ST-ORG-")) {
    const id = dataId.slice("ST-ORG-".length);
    return `state/organizations/${id}.json`;
  }

  // ST-NAT-{id}-{layer}
  if (dataId.startsWith("ST-NAT-")) {
    const rest = dataId.slice("ST-NAT-".length);
    const lastDash = rest.lastIndexOf("-");
    if (lastDash > 0) {
      const id = rest.slice(0, lastDash);
      const layer = rest.slice(lastDash + 1);
      if (["public", "restricted", "secret"].includes(layer)) {
        return `state/nations/${id}/${layer}.json`;
      }
    }
    // Whole nation directory
    return `state/nations/${rest}`;
  }

  // ST-ENV
  if (dataId === "ST-ENV") return "state/environment.json";

  // ST-REL
  if (dataId === "ST-REL") return "state/relationships.json";

  // TRK-FSH
  if (dataId === "TRK-FSH") return "state/foreshadowing.json";

  // TRK-TEN
  if (dataId === "TRK-TEN") return "state/tension_curve.json";

  // TRK-TML
  if (dataId === "TRK-TML") return "state/timeline.json";

  // TRK-CSQ
  if (dataId === "TRK-CSQ") return "campaign/consequences.md";

  // TRK-ARC-{id}
  if (dataId.startsWith("TRK-ARC-")) {
    const id = dataId.slice("TRK-ARC-".length);
    return `campaign/arcs/${id}.md`;
  }

  // OUT-SCN-{cycle}-{scene}
  if (dataId.startsWith("OUT-SCN-")) {
    const rest = dataId.slice("OUT-SCN-".length);
    const parts = rest.split("-");
    if (parts.length >= 2) {
      const cycle = parts[0];
      const scene = parts[1];
      return `scenes/cycle_${cycle}/scene_${scene}.md`;
    }
  }

  // EVL-RPT
  if (dataId === "EVL-RPT") return "evaluation/report.md";

  // EVL-{type}
  if (dataId.startsWith("EVL-")) {
    const type = dataId.slice("EVL-".length);
    return `evaluation/${type}.json`;
  }

  // RCL (directory listing) or RCL-{actor}-{layer}
  if (dataId === "RCL") return "recall";
  if (dataId.startsWith("RCL-")) {
    const rest = dataId.slice("RCL-".length);
    const lastDash = rest.lastIndexOf("-");
    if (lastDash > 0) {
      const actor = rest.slice(0, lastDash);
      const layer = rest.slice(lastDash + 1);
      if (["recent", "midterm", "longterm", "pinned"].includes(layer)) {
        return `recall/${actor}/${layer}.json`;
      }
    }
    return `recall/${rest}`;
  }

  // META-CFG
  if (dataId === "META-CFG") return "meta/config.json";

  // META-LOG
  if (dataId === "META-LOG") return "meta/session_log.md";

  throw new Error(`Cannot resolve path for DataId: ${dataId}`);
}

/** Check if a data path is JSON (vs Markdown) */
export function isJsonPath(path: string): boolean {
  return path.endsWith(".json");
}
