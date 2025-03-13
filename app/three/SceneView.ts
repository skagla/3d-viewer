import { Group, Material, Mesh, MeshStandardMaterial, Scene } from "three";
import { buildMeshes } from "./utils/build-meshes";
import { Extent, buildScene } from "./utils/build-scene";
import { getCenter3D, getMetadata, transform } from "./utils/utils";
import { MODEL_ID, SERVICE_URL } from "./config";
import {
  Orientation,
  buildClippingplanes,
} from "./utils/build-clipping-planes";
import { buildCoordinateGrid } from "./utils/build-coordinate-grid";
import { DragControls } from "three/examples/jsm/Addons.js";
import {
  DebugProvider,
  HeightDebugProvider,
  MapHeightNode,
  MapTilerProvider,
  MapView,
  OpenStreetMapsProvider,
} from "geo-three";
import { CustomMapHeightNodeShader } from "./CustomMapHeightNodeShader";

export class SceneView {
  private _scene: Scene;
  private _dragControls: DragControls;
  private _model: Group;

  constructor(scene: Scene, model: Group, controls: DragControls) {
    this._scene = scene;
    this._dragControls = controls;
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

    // Set visibility for any existing cap meshes
    for (const key of Object.values(Orientation)) {
      const name = `cap-mesh-group-${key}`;
      const capMeshGroup = this._scene.getObjectByName(name);

      if (capMeshGroup) {
        for (const m of capMeshGroup.children) {
          if (m.name === layerName && m) {
            m.visible = !m.visible;
          }
        }
      }
    }
  }

  toggleCoordinateGrid() {
    const group = this._scene.getObjectByName("coordinate-grid");
    if (group) {
      group.visible = !group.visible;
    }
  }

  toggleWireFrame() {
    // Set global wireframe mode data
    this._scene.userData.wireframe = !this._scene.userData.wireframe;

    // Set wireframe for model
    const model = this._model;
    model.children.forEach((child) => {
      const material = (child as Mesh).material as MeshStandardMaterial;
      material.wireframe = !material.wireframe;
    });

    // Set wireframe for any existing cap meshes
    for (const key of Object.values(Orientation)) {
      const name = `cap-mesh-group-${key}`;
      const capMeshGroup = this._scene.getObjectByName(name);

      if (capMeshGroup) {
        capMeshGroup.children.forEach((mesh) => {
          const material = (mesh as Mesh).material as MeshStandardMaterial;
          if (material) {
            material.wireframe = !material.wireframe;
          }
        });
      }
    }
  }

  toggleTopography() {
    const topo = this._scene.getObjectByName("topography");
    if (topo) {
      topo.visible = !topo.visible;
    }
  }
}

const MAPTILER_API_KEY = "1JkD1W8u5UM5Tjd8r3Wl ";
async function init(container: HTMLElement, modelId = MODEL_ID) {
  const modelData = await getMetadata(SERVICE_URL + modelId);
  const mappedFeatures = modelData.mappedfeatures;
  const modelarea = modelData.modelarea;

  // Transfrom extent to EPSG 3857
  const pmin = transform([modelarea.x.min, modelarea.y.min, modelarea.z.min]);
  const pmax = transform([modelarea.x.max, modelarea.y.max, modelarea.z.max]);
  const extent: Extent = {
    xmin: pmin[0],
    xmax: pmax[0],
    ymin: pmin[1],
    ymax: pmax[1],
    zmin: pmin[2],
    zmax: pmax[2],
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
  for (const mesh of meshes) {
    mesh.material.clippingPlanes = planes;
  }

  // Add a coordinate grid to the scene
  const { gridHelper, annotations } = buildCoordinateGrid(extent);
  const annotationsGroup = new Group();
  annotationsGroup.name = "coordinate-grid";
  annotationsGroup.add(...annotations, gridHelper);
  annotationsGroup.visible = false;
  scene.add(annotationsGroup);

  // Create a map tiles provider object
  const provider = new OpenStreetMapsProvider();
  const heightProvider = new MapTilerProvider(
    MAPTILER_API_KEY,
    "tiles",
    "terrain-rgb",
    "png"
  );

  // Create the map view for OSM topography
  const map = new MapView(MapView.PLANAR, provider, heightProvider);
  const customNode = new CustomMapHeightNodeShader(undefined, map);
  map.setRoot(customNode);
  map.rotateX(Math.PI / 2);

  map.name = "topography";
  scene.add(map);

  return { scene, model, dragControls };
}
