import {
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Object3DEventMap,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { DragControls, OrbitControls } from "three/examples/jsm/Addons.js";
import { Extent } from "./build-scene";

enum Orientation {
  X = "x",
  Y = "y",
  Z = "z",
}

type PlaneMesh = Mesh<PlaneGeometry, MeshBasicMaterial, Object3DEventMap>;
type PlaneMeshMap = {
  [key in Orientation]: PlaneMesh;
};

export function createClippingPlanes(
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
  orbitControls: OrbitControls,
  extent: Extent
) {
  const planesData = [
    {
      normal: new Vector3(1, 0, 0),
      d: -extent.xmin,
      orientation: Orientation.X,
    },
    {
      normal: new Vector3(0, 1, 0),
      d: -extent.ymin,
      orientation: Orientation.Y,
    },
    {
      normal: new Vector3(0, 0, -1),
      d: extent.zmax,
      orientation: Orientation.Z,
    },
  ];

  const planeMeshes: Mesh<
    PlaneGeometry,
    MeshBasicMaterial,
    Object3DEventMap
  >[] = [];
  const planes: Plane[] = [];
  let planeMeshMap = {} as Partial<PlaneMeshMap>;
  for (let p of planesData) {
    let name;
    let planeCenter;
    let width;
    let height;
    if (p.orientation === Orientation.X) {
      name = Orientation.X;
      width = extent.ymax - extent.ymin;
      height = extent.zmax - extent.zmin;
      planeCenter = new Vector3(
        -p.d,
        extent.ymax - width / 2,
        extent.zmax - height / 2
      );
    } else if (p.orientation === Orientation.Y) {
      name = Orientation.Y;
      width = extent.xmax - extent.xmin;
      height = extent.zmax - extent.zmin;
      planeCenter = new Vector3(
        extent.xmax - width / 2,
        -p.d,
        extent.zmax - height / 2
      );
    } else {
      name = Orientation.Z;
      width = extent.xmax - extent.xmin;
      height = extent.ymax - extent.ymin;
      planeCenter = new Vector3(
        extent.xmax - width / 2,
        extent.ymax - height / 2,
        p.d
      );
    }

    // Visual representation of the clipping plane
    // Plane is given in Hesse normal form
    const plane = new Plane(p.normal, p.d);

    // Dragging Mechanism
    const planeMesh = new Mesh(
      new PlaneGeometry(width, height),
      new MeshBasicMaterial({
        visible: true,
        color: 0xff0000,
        transparent: true,
        opacity: 0.1,
        side: DoubleSide,
        clipIntersection: false,
      })
    );
    planeMesh.name = name;
    planeMesh.userData.plane = plane;

    planeMesh.position.set(planeCenter.x, planeCenter.y, planeCenter.z);
    if (p.orientation === Orientation.X) {
      planeMesh.rotateY(Math.PI / 2);
      planeMesh.rotateZ(Math.PI / 2);
    } else if (p.orientation === Orientation.Y) {
      planeMesh.rotateX(Math.PI / 2);
    }
    planeMeshes.push(planeMesh);
    planes.push(plane);

    planeMeshMap[p.orientation] = planeMesh;
  }

  for (let pm of planeMeshes) {
    // Let clipping planes clip each other
    const clippingPlanes = planes.filter(
      (p) => !p.normal.equals(pm.userData.plane.normal)
    );

    pm.material.clippingPlanes = clippingPlanes;
  }

  // Enable DragControls for the clipping planes
  const dragControls = new DragControls(
    planeMeshes,
    camera,
    renderer.domElement
  );

  dragControls.addEventListener("dragstart", () => {
    // Disable OrbitControls when dragging starts
    orbitControls.enabled = false;
  });

  dragControls.addEventListener("dragend", () => {
    // Reenable OrbitControls when dragging ends
    orbitControls.enabled = true;
  });

  dragControls.addEventListener("drag", (event) => {
    const object = event.object as PlaneMesh;
    const plane = event.object.userData.plane;
    const width = object.geometry.parameters.width;
    const height = object.geometry.parameters.height;
    if (object.name === Orientation.Z) {
      // Fix rotation of dragged mesh
      event.object.rotation.set(0, 0, 0);

      let newZ;
      if (event.object.position.z > extent.zmax) {
        newZ = extent.zmax;
      } else if (event.object.position.z < extent.zmin) {
        newZ = extent.zmin;
      } else {
        newZ = event.object.position.z;
      }

      // Reset position of plane
      plane.constant = newZ;

      // Set position of dragged mesh
      object.position.x = extent.xmax - width / 2;
      object.position.y = extent.ymax - height / 2;
      object.position.z = newZ;

      // Resize other meshes
      resizeMeshes(Orientation.Z, newZ, planeMeshMap as PlaneMeshMap, extent);
    } else if (object.name === Orientation.Y) {
      // Fix rotation of dragged mesh
      event.object.rotation.set(Math.PI / 2, 0, 0);

      let newY;
      if (event.object.position.y > extent.ymax) {
        newY = extent.ymax;
      } else if (event.object.position.y < extent.ymin) {
        newY = extent.ymin;
      } else {
        newY = event.object.position.y;
      }

      // Reset position of plane
      plane.constant = -newY;

      // Set position of dragged mesh
      object.position.x = extent.xmax - width / 2;
      object.position.y = newY;
      object.position.z = extent.zmax - height / 2;

      // Resize other meshes
      resizeMeshes(Orientation.Y, newY, planeMeshMap as PlaneMeshMap, extent);
    } else {
      // Fix rotation of dragged mesh
      event.object.rotation.set(0, Math.PI / 2, Math.PI / 2);

      let newX;
      if (event.object.position.x > extent.xmax) {
        newX = extent.xmax;
      } else if (event.object.position.x < extent.xmin) {
        newX = extent.xmin;
      } else {
        newX = event.object.position.x;
      }

      // Reset position of plane
      plane.constant = -newX;

      // Set position of dragged mesh
      object.position.x = newX;
      object.position.y = extent.ymax - width / 2;
      object.position.z = extent.zmax - height / 2;

      // Resize other meshes
      resizeMeshes(Orientation.X, newX, planeMeshMap as PlaneMeshMap, extent);
    }
  });

  return { planeMeshes, planes };
}

function resizeMeshes(
  orientation: Orientation,
  newCoordinate: number,
  planeMeshes: PlaneMeshMap,
  extent: Extent
) {
  if (orientation === Orientation.X) {
    // Resize y-clipping plane
    let planeMesh = planeMeshes[Orientation.Y];
    let width = extent.xmax - newCoordinate;
    let height = planeMesh.geometry.parameters.height;
    const y = planeMesh.position.y;
    planeMesh.geometry.dispose();
    planeMesh.geometry = new PlaneGeometry(width, height);
    planeMesh.position.set(
      extent.xmax - width / 2,
      y,
      extent.zmax - height / 2
    );

    // Resize z-clipping-plane
    planeMesh = planeMeshes[Orientation.Z];
    width = extent.xmax - newCoordinate;
    height = planeMesh.geometry.parameters.height;
    const z = planeMesh.position.z;
    planeMesh.geometry.dispose();
    planeMesh.geometry = new PlaneGeometry(width, height);
    planeMesh.position.set(
      extent.xmax - width / 2,
      extent.ymax - height / 2,
      z
    );
  } else if (orientation === Orientation.Y) {
    // Resize x-clipping plane
    let planeMesh = planeMeshes[Orientation.X];
    let width = extent.ymax - newCoordinate;
    let height = planeMesh.geometry.parameters.height;
    const x = planeMesh.position.x;
    planeMesh.geometry.dispose();
    planeMesh.geometry = new PlaneGeometry(width, height);
    planeMesh.position.set(
      x,
      extent.ymax - width / 2,
      extent.zmax - height / 2
    );

    // Resize z-clipping-plane
    planeMesh = planeMeshes[Orientation.Z];
    width = planeMesh.geometry.parameters.width;
    height = extent.ymax - newCoordinate;
    const z = planeMesh.position.z;
    planeMesh.geometry.dispose();
    planeMesh.geometry = new PlaneGeometry(width, height);
    planeMesh.position.set(
      extent.xmax - width / 2,
      extent.ymax - height / 2,
      z
    );
  } else if (orientation === Orientation.Z) {
    // Resize x-clipping-plane
    let planeMesh = planeMeshes[Orientation.X];
    let width = planeMesh.geometry.parameters.width;
    let height = newCoordinate - extent.zmin;
    const x = planeMesh.position.x;
    planeMesh.geometry.dispose();
    planeMesh.geometry = new PlaneGeometry(width, height);
    planeMesh.position.set(
      x,
      extent.ymax - width / 2,
      extent.zmax - height / 2
    );

    // Resize y-clipping plane
    planeMesh = planeMeshes[Orientation.Y];
    width = planeMesh.geometry.parameters.width;
    height = newCoordinate - extent.zmin;
    const y = planeMesh.position.y;
    planeMesh.geometry.dispose();
    planeMesh.geometry = new PlaneGeometry(width, height);
    planeMesh.position.set(
      extent.xmax - width / 2,
      y,
      extent.zmax - height / 2
    );
  }
}
