import { AxesHelper, Group } from "three";
import { buildMeshes } from "./build-meshes";
import { Extent, buildScene } from "./build-scene";
import { getMetadata } from "./get-metadata";
import { MODEL_ID, SERVICE_URL } from "../config";
import { createClippingPlane } from "./build-clipping-plane";
import { buildGrid } from "./build-grid";

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

  const { renderer, scene, camera, controls } = await buildScene(
    container,
    extent
  );

  const { planeMesh, plane } = createClippingPlane(
    renderer,
    camera,
    controls,
    extent
  );
  scene.add(planeMesh);

  const clippingPlanes = [plane];

  const meshes = await buildMeshes(mappedFeatures, clippingPlanes);
  const mappedFeaturesGroup = new Group();
  mappedFeaturesGroup.add(...meshes);
  scene.add(mappedFeaturesGroup);

  const { gridHelper, annotations } = buildGrid(extent);
  const annotationsGroup = new Group();
  annotationsGroup.add(...annotations);
  scene.add(gridHelper, annotationsGroup);

  //const axesHelper = new AxesHelper(5);
  //scene.add(axesHelper);
}
