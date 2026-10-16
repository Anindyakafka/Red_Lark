import { REPO_URL } from "../config/site";
import { validateScene } from "../studio/model";

/** Retry-safe migration; remove the old value only after a validated, successful write. */
export function migrateLocalDrafts(storage: Storage) {
  const previous = new URL(REPO_URL).pathname.split("/").at(-1)!;
  for (const suffix of ["studio.v2", "saved.v1"]) {
    const from = `${previous}.${suffix}`;
    const to = `redlark.${suffix}`;
    const raw = storage.getItem(from);
    if (raw === null) continue;
    if (storage.getItem(to) !== null) continue;
    try {
      const value: unknown = JSON.parse(raw);
      const valid =
        suffix === "studio.v2"
          ? validateScene(value)
          : Array.isArray(value) && value.every((v) => typeof v === "string");
      if (!valid) continue;
      storage.setItem(to, raw);
      storage.removeItem(from);
    } catch {
      // Corrupt values and unavailable storage must not destroy the original draft.
    }
  }
}
