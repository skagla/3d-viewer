import {
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { buildMeshes } from "./utils/build-meshes";
import { Extent, buildScene } from "./utils/build-scene";
import { getMetadata, transform } from "./utils/utils";
import { MAPTILER_API_KEY, MODEL_ID, SERVICE_URL } from "./config";
import {
  Orientation,
  buildClippingplanes,
} from "./utils/build-clipping-planes";
import {
  buildCoordinateGrid,
  buildHeightGrid,
} from "./utils/build-coordinate-grid";
import {
  DragControls,
  OBJExporter,
  OrbitControls,
} from "three/examples/jsm/Addons.js";
import { MapTilerProvider, MapView, OpenStreetMapsProvider } from "geo-three";
import { CustomMapHeightNodeShader } from "./CustomMapHeightNodeShader";
import { Data, createSVG } from "./utils/create-borehole-svg";

export type CustomEvent = CustomEventInit<{
  element: SVGSVGElement | null;
}>;

export class SceneView extends EventTarget {
  private _scene: Scene;
  private _dragControls: DragControls;
  private _model: Group;
  private _camera: PerspectiveCamera;
  private _container: HTMLElement;
  private _raycaster: Raycaster;
  private _extent: Extent;
  private _startX: number = 0;
  private _startY: number = 0;
  private _isDragging: boolean = false;
  private static _DRAG_THRESHOLD = 5;
  private _callback: EventListenerOrEventListenerObject | null = null;
  private _orbitControls: OrbitControls;
  private _renderer: WebGLRenderer;

  constructor(
    scene: Scene,
    model: Group,
    dragControls: DragControls,
    camera: PerspectiveCamera,
    container: HTMLElement,
    extent: Extent,
    orbitControls: OrbitControls,
    renderer: WebGLRenderer
  ) {
    super();
    this._scene = scene;
    this._dragControls = dragControls;
    this._model = model;
    this._camera = camera;
    this._container = container;
    this._raycaster = new Raycaster();
    this._extent = extent;
    this._orbitControls = orbitControls;
    this._renderer = renderer;
  }

  static async create(container: HTMLElement, modelId: string) {
    const { scene, model, dragControls, camera, extent, controls, renderer } =
      await init(container, modelId);

    return new SceneView(
      scene,
      model,
      dragControls,
      camera,
      container,
      extent,
      controls,
      renderer
    );
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

  private _onPointerClick(event: MouseEvent) {
    // Convert screen position to NDC (-1 to +1 range)
    const pointer = new Vector2();
    const clientRectangle = this._container.getBoundingClientRect();
    pointer.x = (event.clientX / clientRectangle.width) * 2 - 1;
    pointer.y = -(event.clientY / clientRectangle.height) * 2 + 1;

    // Raycast from the camera
    this._raycaster.setFromCamera(pointer, this._camera);

    // Intersect with plane
    const plane = new Plane(new Vector3(0, 0, 1), 0);
    const worldPoint = new Vector3();
    this._raycaster.ray.intersectPlane(plane, worldPoint);

    // Cast a vertical ray from above
    this._castVerticalRay(worldPoint);
  }

  private _castVerticalRay(targetPosition: Vector3) {
    const z = this._extent.zmax + 10000;
    const startPoint = new Vector3(targetPosition.x, targetPosition.y, z);

    const direction = new Vector3(0, 0, -1);
    this._raycaster.set(startPoint, direction);

    // Check intersections with objects in the scene
    const meshes = this._model.children.filter((c) => c.name !== "Topography");
    const intersects = this._raycaster.intersectObjects(meshes, true);

    // Remove existing point and add visual marker
    this._removePoint();
    this._addPoint(targetPosition);

    // Iterate over intersections
    if (intersects.length > 0) {
      const data: Data[] = [];
      for (let i = 0; i < intersects.length; i += 2) {
        const depthStart = intersects[i].point.z;
        const depthEnd = intersects[i + 1].point.z;
        const name = intersects[i].object.name;
        const color = `#${(
          (intersects[i].object as Mesh).material as MeshStandardMaterial
        ).color.getHexString()}`;

        // Avoid duplicate entries, just update the depth information
        const index = data.findIndex((d) => d.name === name);
        if (index > -1) {
          data[index] = {
            depthStart: data[index].depthStart,
            depthEnd,
            name,
            color,
          };
        } else {
          data.push({ depthStart, depthEnd, name, color });
        }
      }

      const element = createSVG(data, 400, 600, this._extent);
      const event = new CustomEvent("svg-created", {
        detail: { element },
      });
      this.dispatchEvent(event);
    } else {
      const event = new CustomEvent("svg-created", {
        detail: null,
      });
      this.dispatchEvent(event);
    }
  }

  private _pointerDownListener = (event: PointerEvent) => {
    this._isDragging = false;
    this._startX = event.clientX;
    this._startY = event.clientY;
  };

  private _pointerMoveListener = (event: PointerEvent) => {
    if (
      Math.abs(event.clientX - this._startX) > SceneView._DRAG_THRESHOLD ||
      Math.abs(event.clientY - this._startY) > SceneView._DRAG_THRESHOLD
    ) {
      this._isDragging = true;
    }
  };

  private _pointerUpListener = (event: PointerEvent) => {
    if (!this._isDragging) {
      this._onPointerClick(event);
    }
  };

  enableRaycaster(callback: EventListenerOrEventListenerObject) {
    this._container.addEventListener("pointerdown", this._pointerDownListener);
    this._container.addEventListener("pointermove", this._pointerMoveListener);
    this._container.addEventListener("pointerup", this._pointerUpListener);

    // Add event listener for svg-created event
    this.addEventListener("svg-created", callback);
    this._callback = callback;
  }

  disableRaycaster() {
    this._container.removeEventListener(
      "pointerdown",
      this._pointerDownListener
    );
    this._container.removeEventListener(
      "pointermove",
      this._pointerMoveListener
    );
    this._container.removeEventListener("pointerup", this._pointerUpListener);

    if (this._callback) {
      this.removeEventListener("svg-created", this._callback);
    }
  }

  // Add point marker for bore profiles
  private _addPoint(point: Vector3) {
    const geometry = new SphereGeometry(1000, 16, 16);
    const material = new MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new Mesh(geometry, material);
    sphere.name = "point-marker";

    sphere.position.set(point.x, point.y, point.z);
    this._scene.add(sphere);
  }

  private _removePoint() {
    const o = this._scene.getObjectByName("point-marker");

    if (o) {
      this._scene.remove(o);
    }
  }

  // Function to export the group as an OBJ file
  exportOBJ() {
    const exporter = new OBJExporter();
    const objString = exporter.parse(this._model);

    // Create a Blob and trigger a download
    const blob = new Blob([objString], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "geologic_model.obj";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Reset view to initial extent
  resetView() {
    this._orbitControls.reset();
  }

  explode(explode: boolean) {
    const DISPLACEMENT = 2000;
    for (let i = 1; i < this._model.children.length; i++) {
      const mesh = this._model.children[i];

      if (explode) {
        const displacement =
          (this._model.children.length - i - 1) * DISPLACEMENT;
        mesh.userData.originalPosition = mesh.position.clone();
        mesh.translateZ(displacement);

        if (i === 1) {
          this._model.userData.zmax = this._extent.zmax;
          this._extent.zmax += displacement;
        }
      } else {
        if (mesh.userData.originalPosition) {
          mesh.position.copy(mesh.userData.originalPosition);
        }
      }
    }

    // Reset extent
    if (!explode && this._model.userData.zmax) {
      this._extent.zmax = this._model.userData.zmax;
    }

    const box = this._scene.getObjectByName("clipping-box");
    let visible = false;
    if (box) {
      visible = box.visible;
      this._scene.remove(box);
    }
    const { planes, dragControls } = buildClippingplanes(
      this._renderer,
      this._camera,
      this._orbitControls,
      this._extent,
      this._model.children as Mesh[],
      this._scene,
      visible
    );

    this._dragControls.dispose();
    this._dragControls = dragControls;

    // Add clipping planes to the meshes
    for (const mesh of this._model.children) {
      ((mesh as Mesh).material as Material).clippingPlanes = planes;
    }

    // Remove existing cap meshes
    for (const o in Orientation) {
      const capMeshGroupName = `cap-mesh-group-${o}`;
      let capMeshGroup = this._scene.getObjectByName(capMeshGroupName);
      while (capMeshGroup) {
        this._scene.remove(capMeshGroup);
        capMeshGroup = this._scene.getObjectByName(capMeshGroupName);
      }
    }
  }
}

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
  const visible = false;
  const { planes, dragControls } = buildClippingplanes(
    renderer,
    camera,
    controls,
    extent,
    meshes,
    scene,
    visible
  );

  // Add clipping planes to the meshes
  for (const mesh of meshes) {
    mesh.material.clippingPlanes = planes;
  }

  // Add a coordinate grid to the scene
  const { gridHelper, annotations } = buildCoordinateGrid(extent);
  const { heightGridHelper, heightAnnotations } = buildHeightGrid(extent);
  const annotationsGroup = new Group();
  annotationsGroup.name = "coordinate-grid";
  annotationsGroup.add(
    ...annotations,
    gridHelper,
    ...heightAnnotations,
    heightGridHelper
  );
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

  return { scene, model, dragControls, camera, extent, controls, renderer };
}
