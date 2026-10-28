import type { Layer, PosterGroup, Scene } from "@/lib/types";

export function groupFor(scene: Scene, layer: Layer | undefined) {
  return layer?.groupId ? scene.groups?.find((group) => group.id === layer.groupId) : undefined;
}

function rotated(x: number, y: number, degrees: number) {
  const angle = (degrees * Math.PI) / 180;
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle),
  };
}

export function groupLocalLayer(layer: Layer, group: PosterGroup): Layer {
  const center = rotated(
    layer.x + layer.width / 2 - group.x - group.width / 2,
    layer.y + layer.height / 2 - group.y - group.height / 2,
    -group.rotation,
  );
  return {
    ...layer,
    x: center.x + group.width / 2 - layer.width / 2,
    y: center.y + group.height / 2 - layer.height / 2,
    rotation: layer.rotation - group.rotation,
  };
}

/** Affine transform of a source poster. Individual vector/image data is unchanged. */
export function transformGroup(scene: Scene, id: string, next: PosterGroup): Scene {
  const before = scene.groups?.find((group) => group.id === id);
  if (!before) return scene;
  const sx = next.width / before.width;
  const sy = next.height / before.height;
  const layers = scene.layers.map((layer) => {
    if (layer.groupId !== id) return layer;
    const local = groupLocalLayer(layer, before);
    const width = local.width * sx;
    const height = local.height * sy;
    const offset = rotated(
      (local.x + local.width / 2 - before.width / 2) * sx,
      (local.y + local.height / 2 - before.height / 2) * sy,
      next.rotation,
    );
    return {
      ...layer,
      x: next.x + next.width / 2 + offset.x - width / 2,
      y: next.y + next.height / 2 + offset.y - height / 2,
      width,
      height,
      rotation: layer.rotation + next.rotation - before.rotation,
    };
  });
  return {
    ...scene,
    groups: scene.groups?.map((group) => (group.id === id ? next : group)),
    layers,
  };
}
