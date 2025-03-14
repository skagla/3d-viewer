import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  Group,
  Object3D,
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

  camera.position.set(center.x, center.y - 200000, extent.zmax + 100000);
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
  controls.maxDistance = maxSize * 3;
  controls.minDistance = maxSize / 5;
  controls.update();

  // Scene
  // set wireframe to false on initial load
  scene = new Scene();
  scene.userData.wireframe = false;

  // Add lights to the scene
  buildDefaultLights(scene, extent);

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
