import {
  Color,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { buildMeshes } from "./utils/build-meshes";
import { Extent, animate, buildScene } from "./utils/build-scene";
import { getMetadata, transform } from "./utils/utils";
import { MODEL_ID, SERVICE_URL } from "./config";
import {
  Orientation,
  buildClippingplanes,
} from "./utils/build-clipping-planes";
import {
  buildCoordinateGrid,
  buildHeightGrid,
} from "./utils/build-coordinate-grid";
import {
  CSS2DObject,
  CSS2DRenderer,
  DragControls,
  OBJExporter,
  OrbitControls,
} from "three/examples/jsm/Addons.js";
import { LODFrustum, MapView } from "geo-three";
import { Data, createSVG } from "./utils/create-borehole-svg";
import { HillShadeProvider } from "./geo-three/HillShadeProvider";
import { CustomMapNode } from "./geo-three/CustomMapNode";
import { TextureType } from "./utils/TextureType";

export type CustomEvent = CustomEventInit<{
  element: SVGSVGElement | null;
}>;

export class SceneView extends EventTarget {
  private _scene: Scene;
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
  private _dragControls: DragControls | null = null;
  private _renderer: WebGLRenderer;
  private _labelRederer: CSS2DRenderer;
  private static _DISPLACEMENT = 2000;

  private _raycastState: number = 0;
  public static RAYCAST_STATE_INFO = 0;
  public static RAYCAST_STATE_VIRTUAL_PROFILE = 1;

  private _infoLabel: CSS2DObject;
  private _infoDiv: HTMLDivElement;
  private _infoName: HTMLDivElement;
  private _infoCitation: HTMLDivElement;
  private _mappedFeatures: MappedFeature[];

  //textures
  private _texture_empty: Texture;
  private _texture_sand: Texture;
  private _texture_schotter: Texture;
  private _texture_kalk: Texture;
  private _texture_kristallin: Texture;

  constructor(
    scene: Scene,
    model: Group,
    camera: PerspectiveCamera,
    container: HTMLElement,
    extent: Extent,
    orbitControls: OrbitControls,
    renderer: WebGLRenderer,
    labelRenderer: CSS2DRenderer,
    infoLabel: CSS2DObject,
    infoDiv: HTMLDivElement,
    infoName: HTMLDivElement,
    infoCitation: HTMLDivElement,
    mappedFeatures: MappedFeature[],
  ) {
    super();
    this._scene = scene;
    this._model = model;
    this._camera = camera;
    this._container = container;
    this._raycaster = new Raycaster();
    this._extent = extent;
    this._orbitControls = orbitControls;
    this._renderer = renderer;
    this._labelRederer = labelRenderer;
    this._infoLabel = infoLabel;
    this._infoDiv = infoDiv;
    this._infoName = infoName;
    this._infoCitation = infoCitation;
    this._mappedFeatures = mappedFeatures;

    //load Textures
    const textureLoader = new TextureLoader();
    this._texture_empty = textureLoader.load("/3d-viewer/textures/white_texture.jpg");
    this._texture_sand = textureLoader.load("/3d-viewer/textures/sand.jpg");
    this._texture_schotter = textureLoader.load("/3d-viewer/textures/schotter.jpg");
    this._texture_kalk = textureLoader.load("/3d-viewer/textures/kalk_5pt_bg-w.jpg");
    this._texture_kristallin = textureLoader.load("/3d-viewer/textures/kristallin.jpg");

    this._texture_empty.colorSpace = SRGBColorSpace;
    this._texture_empty.wrapS = RepeatWrapping;
    this._texture_empty.wrapT = RepeatWrapping;

    this._texture_sand.colorSpace = SRGBColorSpace;
    this._texture_sand.wrapS = RepeatWrapping;
    this._texture_sand.wrapT = RepeatWrapping;
    // console.log(texture_sand);
    this._texture_schotter.colorSpace = SRGBColorSpace;
    this._texture_schotter.wrapS = RepeatWrapping;
    this._texture_schotter.wrapT = RepeatWrapping;

    this._texture_kalk.colorSpace = SRGBColorSpace;
    this._texture_kalk.wrapS = RepeatWrapping;
    this._texture_kalk.wrapT = RepeatWrapping;

    this._texture_kristallin.colorSpace = SRGBColorSpace;
    this._texture_kristallin.wrapS = RepeatWrapping;
    this._texture_kristallin.wrapT = RepeatWrapping;

  }

  static async create(container: HTMLElement, modelId: string) {
    const data = await init(container, modelId);
    if (data) {
      const {
        scene,
        model,
        camera,
        extent,
        controls,
        renderer,
        labelRenderer,
        infoLabel,
        infoDiv,
        infoName,
        infoCitation,
        mappedFeatures,
      } = data;
      //TODO
      // console.log(data);
      return new SceneView(
        scene,
        model,
        camera,
        container,
        extent,
        controls,
        renderer,
        labelRenderer,
        infoLabel,
        infoDiv,
        infoName,
        infoCitation,
        mappedFeatures
      );
    } else {
      return null;
    }
  }

  get scene() {
    return this._scene;
  }

  get model() {
    return this._model;
  }

  toggleClippingBox(on = true) {
    if (on) {
      this._resetClippingBox();
    } else {
      this._removeClippingBoxObjects();
    }
  }

  toggleLayerVisibility(layerName: string) {
    const mesh = this.scene.getObjectByName(layerName);
    if (mesh) {
      mesh.visible = !mesh.visible;
    }

    // Set visibility for any existing cap meshes
    for (const key of Object.values(Orientation)) {
      const name = `cap-mesh-group-${key}`;
      const capMeshGroup = this._scene.getObjectByName(name);

      if (capMeshGroup) {
        for (const m of capMeshGroup.children) {
          if (m && m.name === layerName) {
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
  private _onClickLink() {
    console.log("click");
  }
  private _onPointerClick(event: MouseEvent) {
    // Convert screen position to NDC (-1 to +1 range)
    const pointer = new Vector2();
    const clientRectangle = this._container.getBoundingClientRect();
    pointer.x = (event.clientX / clientRectangle.width) * 2 - 1;
    pointer.y = -(event.clientY / clientRectangle.height) * 2 + 1;

    // Raycast from the camera
    this._raycaster.setFromCamera(pointer, this._camera);
    const meshes = this._model.children.filter((c) => c.name !== "Topography");
    const intersects = this._raycaster.intersectObjects(meshes);

    // if raycast got a hit
    if (intersects.length > 0) {
      const intersectionObject = intersects[0];

      switch (this._raycastState) {

        case SceneView.RAYCAST_STATE_INFO:

          //loop through mappedFeatures and find the one with the same name we clicked on and set content of the info Div
          for (let index = 0; index < this._mappedFeatures.length; index++) {
            const mappedFeature = this._mappedFeatures[index];
            if (mappedFeature.name === intersectionObject.object.name) {
              //set name
              this._infoName.innerHTML = "";
              const _infoNameP = document.createElement("h3");
              _infoNameP.style.color = "black";
              this._infoName.appendChild(_infoNameP);

              _infoNameP.textContent = "name: " + mappedFeature.name;

              //set citation
              this._infoCitation.innerHTML = "";
              const _infoCitationLink = document.createElement("a");
              _infoCitationLink.style.color = "blue";

              // _infoCitationLink.setAttribute('href', "http://google.com");
              // _infoCitationLink.setAttribute('click', '_onClickLink');
              // this._infoDiv.addEventListener('click', function (ev) {
              //   ev.stopPropagation();
              //   console.log("debug");

              // });
              if (mappedFeature.geologicdescription.citation != null)
                _infoCitationLink.href = mappedFeature.geologicdescription.citation;

              _infoCitationLink.innerText = "Citation";
              this._infoCitation.appendChild(_infoCitationLink);
              break;
            }

          }
          // this._infoDiv.textContent = intersectionObject.object.name;

          this._infoLabel.position.set(intersectionObject.point.x, intersectionObject.point.y, intersectionObject.point.z);
          break;

        case SceneView.RAYCAST_STATE_VIRTUAL_PROFILE:
          // Cast a vertical ray from above
          this._castVerticalRay(intersectionObject.point);
          break;
      }
    }
    //nothing is clicked
    else {
      switch (this._raycastState) {

        case SceneView.RAYCAST_STATE_INFO:
          break;
      }
    }
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
      let lastName = "";
      let depthEnd;
      for (let i = 0; i < intersects.length; i++) {
        const depthStart = intersects[i].point.z;

        if (i === intersects.length - 1) {
          depthEnd = depthStart;
        } else {
          depthEnd = intersects[i + 1].point.z;
        }
        const name = intersects[i].object.name;
        const color = `#${(
          ((intersects[i].object as Mesh).material as ShaderMaterial).uniforms
            .color.value as Color
        ).getHexString()}`;

        // Update depthEnd when name is the same
        const index = data.length === 0 ? 0 : data.length - 1;
        if (name === lastName) {
          data[index].depthEnd = depthEnd;
        } else {
          data.push({ depthStart, depthEnd, name, color });
        }

        lastName = name;
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

  private _removeClippingBoxObjects() {
    // Remove existing boxes
    const box = this._scene.getObjectByName("clipping-box");
    if (box) {
      this._scene.remove(box);
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

    // Remove drag controls
    if (this._dragControls) {
      this._dragControls.dispose();
      this._dragControls = null;
    }

    // Remove clipping planes
    for (const mesh of this._model.children) {
      ((mesh as Mesh).material as Material).clippingPlanes = null;
    }
  }

  // Reset clipping box
  private _resetClippingBox() {
    this._removeClippingBoxObjects();

    const { planes, dragControls } = buildClippingplanes(
      this._renderer,
      this._labelRederer,
      this._camera,
      this._orbitControls,
      this._extent,
      this._model.children as Mesh[],
      this._scene
    );

    this._dragControls = dragControls;

    // Add clipping planes to the meshes
    for (const mesh of this._model.children) {
      ((mesh as Mesh).material as Material).clippingPlanes = planes;
    }
  }

  // Explode meshes
  explode(explode: boolean) {
    if (explode) {
      // Save previous zmax value
      this._scene.userData.zmax = this._extent.zmax;

      const maxDisplacement =
        this._model.children.length * SceneView._DISPLACEMENT;

      this._extent.zmax += maxDisplacement;
    } else {
      // Reset extent
      this._extent.zmax = this._scene.userData.zmax;
    }

    // Reset clipping box
    const box = this._scene.getObjectByName("clipping-box");
    if (box && box.visible) {
      this._resetClippingBox();
    }

    for (let i = 0; i < this._model.children.length; i++) {
      const mesh = this._model.children[i];

      if (explode) {
        const displacement =
          (this._model.children.length - i - 1) * SceneView._DISPLACEMENT;
        mesh.userData.originalPosition = mesh.position.clone();
        mesh.translateZ(displacement);
      } else {
        if (mesh.userData.originalPosition) {
          mesh.position.copy(mesh.userData.originalPosition);
        }
      }
    }
  }



  textureMesh(useTexture: boolean, meshName: string, textureType: TextureType
  ) {
    // Set textures for model
    const model = this._model;
    model.children.forEach((child) => {
      // const material = (child as Mesh).material as ShaderMaterial;
      const material = (child as Mesh).material as MeshStandardMaterial;

      if (child.name === meshName) {
        switch (textureType) {
          case TextureType.NO_TEXTURE:
            material.map = this._texture_empty;
            break;
          case TextureType.SAND:
            material.map = this._texture_sand;
            break;
          case TextureType.SCHOTTER:
            material.map = this._texture_schotter;
            break;
          case TextureType.KALK:
            material.map = this._texture_kalk;
            break;
          case TextureType.KRISTALLIN:
            material.map = this._texture_kristallin;
            break;
        }
      }
    });

    // Set textures for any existing cap meshes
    for (const key of Object.values(Orientation)) {
      const name = `cap-mesh-group-${key}`;
      const capMeshGroup = this._scene.getObjectByName(name);

      // TODO
      if (capMeshGroup) {
        capMeshGroup.children.forEach((mesh) => {
          const material = (mesh as Mesh).material as MeshStandardMaterial;
          console.log(material);
          if (material) {
            switch (textureType) {
              case TextureType.NO_TEXTURE:
                material.map = this._texture_empty;
                break;
              case TextureType.SAND:
                material.map = this._texture_sand;
                break;
              case TextureType.SCHOTTER:
                material.map = this._texture_schotter;
                break;
              case TextureType.KALK:
                material.map = this._texture_kalk;
                break;
              case TextureType.KRISTALLIN:
                material.map = this._texture_kristallin;
                break;
            }
          }
        });
      }
    }
  }

  colorMesh(meshName: string, color: Color) {
    const model = this._model;
    model.children.forEach((child) => {
      // console.log(child.name);
      // console.log(meshName);
      if (child.name === meshName) {
        const material = (child as Mesh).material as MeshStandardMaterial;
        material.color = color;
      }

    });
  }

  // Set z scaling factor
  setZScale(scale: number) {
    // Set scale factor
    this._scene.scale.set(1, 1, scale);

    // Reset clipping box
    const box = this._scene.getObjectByName("clipping-box");
    if (box && box.visible) {
      this._resetClippingBox();
    }
  }

  //Set RaycastState for switching between virtual profile and info-popup
  setRaycastState(raycastState: number) {
    this._raycastState = raycastState;
  }
}

async function init(container: HTMLElement, modelId = MODEL_ID) {
  const modelData = await getMetadata(SERVICE_URL + modelId);
  if (!modelData) return null;

  const mappedFeatures = modelData.mappedfeatures;
  const modelarea = modelData.modelarea;

  if (!mappedFeatures) return null;

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

  const { renderer, labelRenderer, scene, camera, controls } = buildScene(container, extent);

  // Start render loop
  renderer.setAnimationLoop(animate(() => { }));

  // Build the 3D model
  const model = new Group();
  model.name = "geologic-model";
  scene.add(model);
  await buildMeshes(mappedFeatures, model, scene);

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

  //Add INFO LABEL
  const _infoDiv = document.createElement("div");
  _infoDiv.className = "info-label";
  // _infoDiv.textContent = "TEST";
  // _infoDiv.style.color = "red";
  _infoDiv.className = "p-5 border rounded border-gray-200 dark:border-gray-400 bg-white"
  //  _infoDiv.className="p-5 border border-gray-200 dark:border-gray-400 dark:bg-gray-700"
  //   _infoDiv.style.backgroundColor = "transparent";

  const _infoName = document.createElement("div");
  _infoName.className = "info-label-name";
  _infoName.textContent = "TEST";
  _infoName.style.color = "black";
  _infoName.style.backgroundColor = "transparent";
  _infoDiv.appendChild(_infoName);
  const _infoCitation = document.createElement("div");
  _infoCitation.className = "info-label-citation";
  _infoCitation.textContent = "TEST";
  _infoCitation.style.color = "black";
  _infoCitation.style.backgroundColor = "transparent";
  _infoDiv.appendChild(_infoCitation);


  const _infoLabel = new CSS2DObject(_infoDiv);
  _infoLabel.position.set(0, 0, 0);
  _infoLabel.center.set(0, 0);
  // console.log(mappedFeatures);
  scene.add(_infoLabel);


  // Create a map tiles provider object
  const provider = new HillShadeProvider();

  // Create the map view for OSM topography
  const lod = new LODFrustum();
  //lod.simplifyDistance = 225;
  //lod.subdivideDistance = 80;

  const map = new MapView(MapView.PLANAR, provider);
  const mapNode = new CustomMapNode(null, map);
  map.setRoot(mapNode);
  map.lod = lod;
  map.rotateX(Math.PI / 2);

  map.name = "osm-topography";
  map.visible = false;
  scene.add(map);

  // Update render loop to include topography
  renderer.setAnimationLoop(animate(() => { }));

  return {
    scene,
    model,
    camera,
    extent,
    controls,
    renderer,
    labelRenderer,
    infoLabel: _infoLabel,
    infoDiv: _infoDiv,
    infoName: _infoName,
    infoCitation: _infoCitation,
    mappedFeatures,
  };
}
