import { Group, Vector3 } from "three";
import { buildMeshes } from "./build-meshes";
import { Extent, buildScene } from "./build-scene";
import { getMetadata } from "./get-metadata";
import { MODEL_ID, SERVICE_URL } from "../config";

export async function init(container: HTMLElement) {
  const modelData = await getMetadata(SERVICE_URL + MODEL_ID);
  const mappedFeatures = modelData.mappedfeatures;
  const modelarea = modelData.modelarea;

  const extent: Extent = {
    xmin: modelarea.x.min,
    xmax: modelarea.x.max,
    ymin: modelarea.y.min,
    ymax: modelarea.y.max,
    zmin: modelarea.z.min,
    zmax: modelarea.z.max,
  };

  const { renderer, scene, camera } = await buildScene(container, extent);
  const meshes = await buildMeshes(mappedFeatures);

  const mappedFeaturesGroup = new Group();
  mappedFeaturesGroup.add(...meshes);
  scene.add(mappedFeaturesGroup);
  // scene.add(meshes[8]);
}
