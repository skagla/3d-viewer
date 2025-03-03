import { Color, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";

import { buildDefaultLights } from "./build-default-lights";
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
export async function buildScene(container: HTMLElement, extent: Extent) {
  const maxSize = getMaxSize(extent);
  const center = getCenter3D(extent);

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera = new PerspectiveCamera(
    50,
    width / height,
    maxSize * 0.1,
    maxSize * 25
  );

  camera.position.set(center.x, center.y, extent.zmax + 150000);
  camera.lookAt(center);

  renderer = new WebGLRenderer({
    alpha: true,
    logarithmicDepthBuffer: true,
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.localClippingEnabled = true;
  renderer.setAnimationLoop(animate);
  window.addEventListener("resize", () => onWindowResize(container));

  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(center.x, center.y, center.z); // Focus on the center
  controls.enableDamping = true; // Smooth camera movement
  controls.maxDistance = maxSize * 5;
  controls.update();

  // Scene will hold all our elements such as objects, cameras and lights
  scene = new Scene();
  scene.background = new Color(0xdddddd);

  buildDefaultLights(scene);

  return { renderer, scene, camera, controls };
}

function onWindowResize(container: HTMLElement) {
  // Update the camera's aspect ratio and the renderer's size to reflect
  // the new screen dimensions upon a browser window resize.
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);

  // required if controls.enableDamping or controls.autoRotate are set to true
  controls.update();
}

function animate() {
  renderer.render(scene, camera);

  // required if controls.enableDamping or controls.autoRotate are set to true
  controls.update();
}
