// src/orchestrator/evaluation.ts
// 読者評価パイプライン — 4ペルソナによる原稿評価

import type { SceneManuscript, RdrReport, EvaluationResult, PersonaDisagreement } from "./types.js";
import { buildRdrAnalyticalPrompt } from "../prompts/templates/rdr-ana.js";
import { buildRdrEmotionalPrompt } from "../prompts/templates/rdr-emo.js";
import { buildRdrCriticalPrompt } from "../prompts/templates/rdr-crt.js";
import { buildRdrNaivePrompt } from "../prompts/templates/rdr-nav.js";
import { runActorSession } from "../runner/actor.js";
import type { ActorId } from "../core/types/ids.js";

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch { /* ignore */ }
  const objMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objMatch) return JSON.parse(objMatch[0]);
  throw new Error("Cannot extract JSON: " + trimmed.slice(0, 200));
}

function detectDisagreements(reports: RdrReport[]): PersonaDisagreement[] {
  // Detect when quadrant opinions diverge significantly
  const disagreements: PersonaDisagreement[] = [];
  const quadrantMap = new Map<string, string[]>();
  for (const r of reports) {
    const key = r.quadrant;
    if (!quadrantMap.has(key)) quadrantMap.set(key, []);
    quadrantMap.get(key)!.push(r.personaId);
  }
  // If personas disagree on quadrant
  if (quadrantMap.size > 1) {
    const groups = Array.from(quadrantMap.entries())
      .map(([q, ps]) => ps.join("/") + "→" + q)
      .join(", ");
    disagreements.push({
      aspect: "四象限評価",
      divergentPersonas: reports.map(r => r.personaId),
      description: "ペルソナ間で評価が分かれた: " + groups,
    });
  }
  return disagreements;
}

function buildEvlReport(reports: RdrReport[], disagreements: PersonaDisagreement[]): string {
  const lines: string[] = [];
  lines.push("## EVL-RPT — 読者評価レポート");
  lines.push("");
  for (const r of reports) {
    lines.push("### " + r.personaId);
    lines.push("四象限: " + r.quadrant + " | スコア: " + r.score.toFixed(2));
    lines.push(r.summary);
    if (r.concerns.length > 0) {
      lines.push("懸念: " + r.concerns.join("; "));
    }
    lines.push("");
  }
  if (disagreements.length > 0) {
    lines.push("### ペルソナ間不一致");
    for (const d of disagreements) {
      lines.push("- **" + d.aspect + "**: " + d.description);
    }
  }
  return lines.join("\n");
}

export async function evaluateManuscript(
  manuscript: SceneManuscript,
  novelDir: string,
): Promise<EvaluationResult> {
  const baseCtx = {
    manuscriptContent: manuscript.markdownContent,
    sceneNumber: manuscript.sceneNumber,
    cycleNumber: manuscript.cycleNumber,
  };

  const [anaResult, emoResult, crtResult, navResult] = await Promise.all([
    runActorSession({
      novelDir,
      actorId: "RDR-ANA" as ActorId,
      prompt: buildRdrAnalyticalPrompt({ actorId: "RDR-ANA", ...baseCtx }),
    }),
    runActorSession({
      novelDir,
      actorId: "RDR-EMO" as ActorId,
      prompt: buildRdrEmotionalPrompt({ actorId: "RDR-EMO", ...baseCtx }),
    }),
    runActorSession({
      novelDir,
      actorId: "RDR-CRT" as ActorId,
      prompt: buildRdrCriticalPrompt({ actorId: "RDR-CRT", ...baseCtx }),
    }),
    runActorSession({
      novelDir,
      actorId: "RDR-NAV" as ActorId,
      prompt: buildRdrNaivePrompt({ actorId: "RDR-NAV", ...baseCtx }),
    }),
  ]);

  function parseReport(actorResult: { content: string }, personaId: RdrReport["personaId"]): RdrReport {
    const json = extractJson(actorResult.content) as {
      quadrant: RdrReport["quadrant"];
      score: number;
      keyMoments: string[];
      concerns: string[];
      summary: string;
    };
    return {
      actorId: personaId as ActorId,
      content: actorResult.content,
      personaId,
      quadrant: json.quadrant,
      score: json.score,
      keyMoments: json.keyMoments ?? [],
      concerns: json.concerns ?? [],
      summary: json.summary,
    };
  }

  const reports: RdrReport[] = [
    parseReport(anaResult, "RDR-ANA"),
    parseReport(emoResult, "RDR-EMO"),
    parseReport(crtResult, "RDR-CRT"),
    parseReport(navResult, "RDR-NAV"),
  ];

  const disagreements = detectDisagreements(reports);
  const evlReport = buildEvlReport(reports, disagreements);

  return { reports, disagreements, evlReport };
}
