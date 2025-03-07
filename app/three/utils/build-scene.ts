import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
} from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { getCenter3D, getMaxSize } from "./utils";

const DEG2RAD = Math.PI / 180;
function buildDefaultLights() {
  // Ambient light
  scene.add(new AmbientLight(0xaaaaaa));

  // Directional lights
  const opt = {
    azimuth: 220,
    altitude: 45,
  };

  const lambda = (90 - opt.azimuth) * DEG2RAD;
  const phi = opt.altitude * DEG2RAD;

  const x = Math.cos(phi) * Math.cos(lambda);
  const y = Math.cos(phi) * Math.sin(lambda);
  const z = Math.sin(phi);

  const light1 = new DirectionalLight(0xffffff, 0.5);
  light1.position.set(x, y, z);
  scene.add(light1);

  // Thin light from the opposite direction
  const light2 = new DirectionalLight(0xffffff, 0.1);
  light2.position.set(-x, -y, -z);
  return light2;
}

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
export function buildScene(container: HTMLElement, extent: Extent) {
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

  camera.position.set(center.x, center.y - 125000, extent.zmax + 100000);
  camera.up.set(0, 0, 1);
  camera.lookAt(center);

  // Initialize the renderer
  renderer = new WebGLRenderer({
    alpha: true,
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
  controls.maxDistance = maxSize * 5;
  controls.update();

  // Scene will hold all our elements such as objects, cameras and lights
  scene = new Scene();

  // Add lights to the scene
  const lights = buildDefaultLights();
  lights.name = "lights";
  scene.add(lights);

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
  renderer.render(scene, camera);

  // required if controls.enableDamping or controls.autoRotate are set to true
  controls.update();
}
