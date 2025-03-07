import { AxesHelper, Group, Mesh, MeshStandardMaterial, Scene } from "three";
import { buildMeshes } from "./utils/build-meshes";
import { Extent, buildScene } from "./utils/build-scene";
import { getMetadata } from "./utils/utils";
import { MODEL_ID, SERVICE_URL } from "./config";
import { buildClippingplanes } from "./utils/build-clipping-planes";
import { buildCoordinateGrid } from "./utils/build-coordinate-grid";
import { DragControls } from "three/examples/jsm/Addons.js";

export class SceneView {
  private _scene: Scene;
  private _dragControls: DragControls;
  private _model: Group;

  constructor(scene: Scene, model: Group, dragControls: DragControls) {
    this._scene = scene;
    this._dragControls = dragControls;
    this._model = model;
  }

  static async create(container: HTMLElement, modelId: string) {
    const { scene, model, dragControls } = await init(container, modelId);
    return new SceneView(scene, model, dragControls);
  }

  get scene() {
    return this._scene;
  }

  get model() {
    return this._model;
  }

  toggleClippingBox() {
    const box = this._scene?.getObjectByName("clipping-box");
    if (box) {
      // Set DragControls
      if (box.visible) {
        this._dragControls.enabled = false;
      } else {
        this._dragControls.enabled = true;
      }

      box.visible = !box.visible;
    }
  }

  toggleLayerVisibility(layerName: string) {
    const mesh = this._model.getObjectByName(layerName);
    if (mesh) {
      mesh.visible = !mesh.visible;
    }
  }

  toggleCoordinateGrid() {
    const group = this._scene.getObjectByName("coordinate-grid");
    if (group) {
      group.visible = !group.visible;
    }
  }

  toggleWireFrame() {
    const model = this._model;
    model.children.forEach((child) => {
      const material = (child as Mesh).material as MeshStandardMaterial;
      material.wireframe = !material.wireframe;
    });
  }
}

async function init(container: HTMLElement, modelId = MODEL_ID) {
  const modelData = await getMetadata(SERVICE_URL + modelId);
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

  const { renderer, scene, camera, controls } = buildScene(container, extent);

  // Build the 3D model
  const meshes = await buildMeshes(mappedFeatures);
  const model = new Group();
  model.add(...meshes);
  model.name = "geologic-model";
  scene.add(model);

  // Build the clipping planes and add them to the scene
  const { planes, dragControls } = buildClippingplanes(
    renderer,
    camera,
    controls,
    extent,
    meshes,
    scene
  );

  // Add clipping planes to the meshes
  for (let mesh of meshes) {
    mesh.material.clippingPlanes = planes;
  }

  // Add a coordinate grid to the scene
  const { gridHelper, annotations } = buildCoordinateGrid(extent);
  const annotationsGroup = new Group();
  annotationsGroup.name = "coordinate-grid";
  annotationsGroup.add(...annotations, gridHelper);
  scene.add(annotationsGroup);

  //const axesHelper = new AxesHelper(5);
  //scene.add(axesHelper);

  return { scene, model, dragControls };
}
