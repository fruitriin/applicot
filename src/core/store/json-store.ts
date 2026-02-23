import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Deterministic JSON serialization: sorted keys, 2-space indent, trailing newline.
 * Ensures clean git diffs.
 */
export function serializeJson(data: unknown): string {
  return JSON.stringify(data, sortedReplacer, 2) + "\n";
}

function sortedReplacer(_key: string, value: unknown): unknown {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const sorted: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[k] = (value as Record<string, unknown>)[k];
    }
    return sorted;
  }
  return value;
}

export async function readJson<T>(novelRoot: string, relativePath: string): Promise<T | null> {
  const fullPath = join(novelRoot, relativePath);
  try {
    const file = Bun.file(fullPath);
    const text = await file.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function writeJson(
  novelRoot: string,
  relativePath: string,
  data: unknown,
): Promise<void> {
  const fullPath = join(novelRoot, relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await Bun.write(fullPath, serializeJson(data));
}

export async function existsJson(novelRoot: string, relativePath: string): Promise<boolean> {
  const fullPath = join(novelRoot, relativePath);
  const file = Bun.file(fullPath);
  return file.exists();
}
