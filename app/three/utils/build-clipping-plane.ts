import {
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { DragControls, OrbitControls } from "three/examples/jsm/Addons.js";
import { Extent } from "./build-scene";
import { getCenter3D } from "./utils";

export function createClippingPlane(
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
  orbitControls: OrbitControls,
  extent: Extent
) {
  const center = getCenter3D(extent);

  const width = extent.xmax - extent.xmin;
  const height = extent.ymax - extent.ymin;
  const d = extent.zmax;

  // Visual representation of the clipping Plane
  // Plane is given in Hesse normal form
  const normalVector = new Vector3(0, 0, -1);
  const plane = new Plane(normalVector, d);

  // Dragging Mechanism
  const planeMesh = new Mesh(
    new PlaneGeometry(width, height),
    new MeshBasicMaterial({
      visible: true,
      color: 0xff0000,
      transparent: true,
      opacity: 0.1,
      side: DoubleSide,
    })
  );
  planeMesh.position.set(center.x, center.y, d);

  const dragControls = new DragControls(
    [planeMesh],
    camera,
    renderer.domElement
  );

  // Disable OrbitControls when dragging starts
  dragControls.addEventListener("dragstart", () => {
    orbitControls.enabled = false;
  });

  // Re-enable OrbitControls when dragging ends
  dragControls.addEventListener("dragend", () => {
    orbitControls.enabled = true;
  });

  dragControls.addEventListener("drag", (event) => {
    const newZ = event.object.position.z;
    plane.constant = newZ;
    planeMesh.position.x = center.x;
    planeMesh.position.y = center.y;
  });

  return { planeMesh, plane };
}
