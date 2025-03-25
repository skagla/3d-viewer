import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  Group,
  Object3D,
  AxesHelper,
  OrthographicCamera,
  Color,
  Vector3,
} from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { getCenter3D, getMaxSize } from "./utils";

export interface Extent {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  zmin: number;
  zmax: number;
}

let controls: OrbitControls;
let renderer: WebGLRenderer;
let camera: PerspectiveCamera;
let scene: Scene;
let axesHelper: AxesHelper;
let overlayCamera: OrthographicCamera;
let overlayScene: Scene;
let overlayWidth = 200;
let overlayHeight = 200;
export function buildScene(container: HTMLElement, extent: Extent) {
  const maxSize = getMaxSize(extent);
  const center = getCenter3D(extent);

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera = new PerspectiveCamera(50, width / height, 10, maxSize * 20);

  camera.position.set(center.x, center.y - 200000, extent.zmax + 100000);
  camera.up.set(0, 0, 1);
  camera.lookAt(center);

  // Initialize the renderer
  renderer = new WebGLRenderer({
    logarithmicDepthBuffer: true,
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.localClippingEnabled = true;
  renderer.setAnimationLoop(animate);

  // Handle window resize event to adapt the aspect ratio
  window.addEventListener("resize", () => onWindowResize(container));

  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(center.x, center.y, center.z); // Focus on the center
  controls.enableDamping = true; // Smooth camera movement
  controls.dampingFactor = 0.1;
  controls.maxDistance = maxSize * 3;
  controls.minDistance = maxSize / 5;
  controls.update();
  controls.saveState();

  // Set wireframe to false on initial load
  scene = new Scene();
  scene.userData.wireframe = false;
  scene.background = new Color(0xbfd1e5);

  // Add lights to the scene
  buildDefaultLights(scene, extent);

  overlayScene = new Scene();

  // Create an overlay camera
  overlayWidth = maxSize;
  overlayHeight = maxSize;
  overlayCamera = new OrthographicCamera(
    -overlayWidth / 2,
    overlayWidth / 2,
    overlayHeight / 2,
    -overlayHeight / 2,
    1,
    10 * maxSize
  );

  // Position the camera similarly to how you did with PerspectiveCamera
  overlayCamera.position.copy(camera.position);
  overlayCamera.up.copy(camera.up);
  overlayCamera.lookAt(
    camera.position.clone().add(camera.getWorldDirection(new Vector3()))
  );
  overlayCamera.updateProjectionMatrix();

  // Create the AxesHelper
  axesHelper = new AxesHelper(maxSize);
  axesHelper.position.set(center.x, center.y, center.z);
  overlayScene.add(axesHelper);

  return { renderer, scene, camera, controls };
}

function onWindowResize(container: HTMLElement) {
  // Update the camera's aspect ratio and the renderer's size to reflect
  // the new screen dimensions upon a browser window resize
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);

  // required if controls.enableDamping or controls.autoRotate are set to true
  controls.update();
}

function animate() {
  // Update controls for main camera
  controls.update();

  renderer.autoClear = false;
  renderer.render(scene, camera);

  renderOverlay();
}

// Render the overlay scene as an overlay
function renderOverlay() {
  // Update the overlay camera position and orientation to match the main camera
  overlayCamera.position.copy(camera.position);
  overlayCamera.rotation.copy(camera.rotation);

  // Render the overlay scene to the screen (position it in the bottom left)
  const width = 200;
  const height = 200;
  renderer.setScissorTest(true);
  renderer.setScissor(10, 10, width, height);
  renderer.setViewport(10, 10, width, height);
  renderer.render(overlayScene, overlayCamera);
  renderer.setScissorTest(false); // Disable scissor testing for the rest of the scene
  renderer.setViewport(
    0,
    0,
    renderer.domElement.width,
    renderer.domElement.height
  );
}

function buildDefaultLights(scene: Scene, extent: Extent) {
  const center = getCenter3D(extent);

  // Directional light position
  const lightPosition = {
    x: center.x,
    y: center.y - 15000,
    z: extent.zmax + 100000,
  };

  const lights = [];

  // Ambient light
  const ambient = new AmbientLight(0xffffff, 1);
  lights.push(ambient);

  // Directional lights
  const directionalLight = new DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(
    lightPosition.x,
    lightPosition.y,
    lightPosition.z
  );

  // Create a target for the directional light
  const target = new Object3D();
  target.position.set(center.x, center.y, center.z);
  scene.add(target);

  directionalLight.target = target;
  lights.push(directionalLight);

  const lightsGroup = new Group();
  lightsGroup.name = "lights";
  lightsGroup.add(...lights);
  scene.add(lightsGroup);
}
