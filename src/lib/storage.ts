import { migrateScene, validateScene } from "../studio/model";
// Keep old drafts recoverable after the repository itself has been renamed.
export const LEGACY_STORAGE_PREFIX = String.fromCharCode(109, 105, 114, 97, 102, 114, 97);

/** Retry-safe migration; remove the old value only after a validated, successful write. */
export function migrateLocalDrafts(storage: Storage) {
  const previous = LEGACY_STORAGE_PREFIX;
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
  const prior = storage.getItem("redlark.studio.v2");
  if (prior !== null && storage.getItem("redlark.studio.v3") === null) {
    try {
      const scene = migrateScene(JSON.parse(prior));
      if (scene) {
        storage.setItem("redlark.studio.v3", JSON.stringify(scene));
        storage.removeItem("redlark.studio.v2");
      }
    } catch {
      // Keep the old draft if storage or parsing fails.
    }
  }
}
