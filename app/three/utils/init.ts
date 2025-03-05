import { AxesHelper, Group } from "three";
import { buildMeshes } from "./build-meshes";
import { Extent, buildScene } from "./build-scene";
import { getMetadata } from "./get-metadata";
import { MODEL_ID, SERVICE_URL } from "../config";
import { createClippingPlanes } from "./build-clipping-plane";
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

  // Create the 3D model
  const meshes = await buildMeshes(mappedFeatures);
  const model = new Group();
  model.add(...meshes);
  model.name = "3d-model";
  scene.add(model);

  // Create the clipping planes and add them to the scene
  const { planeMeshes, planes } = createClippingPlanes(
    renderer,
    camera,
    controls,
    extent,
    meshes,
    scene
  );
  scene.add(...planeMeshes);

  // Add clipping planes to the meshes
  for (let mesh of meshes) {
    mesh.material.clippingPlanes = planes;
  }

  // Add a coordinate grid to the scene
  const { gridHelper, annotations } = buildGrid(extent);
  const annotationsGroup = new Group();
  annotationsGroup.add(...annotations);
  scene.add(gridHelper, annotationsGroup);

  //const axesHelper = new AxesHelper(5);
  //scene.add(axesHelper);
}
