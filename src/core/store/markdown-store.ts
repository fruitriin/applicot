import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

export async function readMarkdown(
  novelRoot: string,
  relativePath: string,
): Promise<string | null> {
  const fullPath = join(novelRoot, relativePath);
  try {
    const file = Bun.file(fullPath);
    return await file.text();
  } catch {
    return null;
  }
}

export async function writeMarkdown(
  novelRoot: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const fullPath = join(novelRoot, relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await Bun.write(fullPath, content);
}

export async function existsMarkdown(
  novelRoot: string,
  relativePath: string,
): Promise<boolean> {
  const fullPath = join(novelRoot, relativePath);
  const file = Bun.file(fullPath);
  return file.exists();
}
