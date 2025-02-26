import {
  BoxGeometry,
  Camera,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";

import { buildDefaultLights } from "./build-default-lights";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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
  const size = Math.max(
    extent.xmax - extent.xmin,
    extent.ymax - extent.ymin,
    extent.zmax - extent.zmin
  );

  const center = new Vector3(
    (extent.xmin + extent.xmax) / 2,
    (extent.ymin + extent.ymax) / 2,
    0
  );

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera = new PerspectiveCamera(30, width / height, 0.1, size * 100);
  camera.position.set(center.x, center.y, size * 5);
  camera.lookAt(center);

  renderer = new WebGLRenderer({
    alpha: true,
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  //renderer.autoClear = false;
  //renderer.setClearColor(0x000000, 0.0); // second param is opacity, 0 => transparent

  // enable clipping
  renderer.localClippingEnabled = true;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(center.x, center.y, center.z); // Focus on the center
  controls.enableDamping = true; // Smooth camera movement
  controls.update();

  // Scene will hold all our elements such as objects, cameras and lights
  scene = new Scene();

  buildDefaultLights(scene);

  // const queryString = window.location.search;
  // const urlParams = new URLSearchParams(queryString);
  // const modelid = parseInt(urlParams.get("model_id") ?? "20", 10);

  renderer.setAnimationLoop(animate);

  window.addEventListener("resize", () => onWindowResize(container));

  const testCube = new Mesh(
    new BoxGeometry(size * 0.1, size * 0.1, size * 0.1),
    new MeshBasicMaterial({ color: 0xff0000 })
  );
  testCube.position.copy(center);
  scene.add(testCube);

  return { renderer, scene, camera };
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
