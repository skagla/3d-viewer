import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3DEventMap,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  ConvexGeometry,
  DragControls,
  OrbitControls,
} from "three/examples/jsm/Addons.js";
import { Extent } from "./build-scene";
import earcut from "earcut";

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
  extent: Extent,
  meshes: Mesh[],
  scene: Scene
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

    // Remove existing cap meshes
    let capMeshGroup = scene.getObjectByName("cap-mesh-group");
    while (capMeshGroup) {
      scene.remove(capMeshGroup);
      capMeshGroup = scene.getObjectByName("cap-mesh-group");
    }
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

    // Remove existing cap meshes
    let capMeshGroup = scene.getObjectByName("cap-mesh-group");
    while (capMeshGroup) {
      scene.remove(capMeshGroup);
      capMeshGroup = scene.getObjectByName("cap-mesh-group");
    }

    const capMeshes = generateCapMeshes(meshes, plane);

    if (capMeshes.length > 0) {
      // Add new cap meshes
      const newCapMeshGroup = new Group();

      newCapMeshGroup.add(...capMeshes);
      newCapMeshGroup.name = "cap-mesh-group";
      scene.add(newCapMeshGroup);
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

// Extract contour and generate cap
function generateCapMeshes(meshes: Mesh[], plane: Plane) {
  const capMeshes: Mesh[] = [];
  for (let mesh of meshes) {
    const position = mesh.geometry.attributes.position.array;
    const indices = mesh.geometry.index ? mesh.geometry.index.array : null;
    const edges: Array<[Vector3, Vector3]> = [];

    for (
      let i = 0;
      i < (indices ? indices.length : position.length / 3);
      i += 3
    ) {
      const i1 = indices ? indices[i] * 3 : i * 3;
      const i2 = indices ? indices[i + 1] * 3 : (i + 1) * 3;
      const i3 = indices ? indices[i + 2] * 3 : (i + 2) * 3;

      const v1 = new Vector3(position[i1], position[i1 + 1], position[i1 + 2]);
      const v2 = new Vector3(position[i2], position[i2 + 1], position[i2 + 2]);
      const v3 = new Vector3(position[i3], position[i3 + 1], position[i3 + 2]);

      // Check if the triangle is cut by the plane
      const d1 = plane.distanceToPoint(v1);
      const d2 = plane.distanceToPoint(v2);
      const d3 = plane.distanceToPoint(v3);

      // Compute intersection points
      const intersections = [];

      if (d1 * d2 < 0) intersections.push(intersectEdge(v1, v2, d1, d2));
      if (d2 * d3 < 0) intersections.push(intersectEdge(v2, v3, d2, d3));
      if (d3 * d1 < 0) intersections.push(intersectEdge(v3, v1, d3, d1));

      if (intersections.length === 2) {
        edges.push([intersections[0], intersections[1]]);
      }
    }

    const polygons: Vector3[][] = buildPolygons(edges);

    const material = new MeshStandardMaterial({
      color: (mesh.material as MeshStandardMaterial).color,
      side: DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const localMeshes = polygons.map((polygon) => {
      const geometry = triangulatePolygon(polygon, plane);

      const capMesh = new Mesh(geometry, material);

      // Offset mesh to avoid flickering
      const offset = 10;
      const normal = plane.normal.clone().multiplyScalar(offset);

      const positionAttr = capMesh.geometry.attributes.position;
      for (let i = 0; i < positionAttr.count; i++) {
        const x = positionAttr.getX(i) - normal.x;
        const y = positionAttr.getY(i) - normal.y;
        const z = positionAttr.getZ(i) - normal.z;
        positionAttr.setXYZ(i, x, y, z);
      }
      positionAttr.needsUpdate = true;

      return capMesh;
    });

    capMeshes.push(...localMeshes);
  }

  return capMeshes;
}

// Build polygons by grouping connected intersection edges
function buildPolygons(edges: Array<[Vector3, Vector3]>): Vector3[][] {
  const polygons: Vector3[][] = [];
  const edgeMap = new Map<string, [Vector3, Vector3]>();

  // Populate the edgeMap for fast lookups
  for (const [v1, v2] of edges) {
    edgeMap.set(`${v1.x},${v1.y},${v1.z}-${v2.x},${v2.y},${v2.z}`, [v1, v2]);
  }

  while (edgeMap.size > 0) {
    const polygon: Vector3[] = [];
    const [start, end] = edgeMap.values().next().value; // Take any edge as a start
    edgeMap.delete(
      `${start.x},${start.y},${start.z}-${end.x},${end.y},${end.z}`
    );

    polygon.push(start, end);
    let lastPoint = end;
    while (true) {
      let foundNextEdge = false;

      for (const [key, [v1, v2]] of edgeMap) {
        // Check if v1 or v2 is the last point to continue the polygon
        if (lastPoint.distanceTo(v1) < 1e-6) {
          polygon.push(v2);
          lastPoint = v2;
          edgeMap.delete(key);
          foundNextEdge = true;
          break;
        } else if (lastPoint.distanceTo(v2) < 1e-6) {
          polygon.push(v1);
          lastPoint = v1;
          edgeMap.delete(key);
          foundNextEdge = true;
          break;
        }
      }

      if (!foundNextEdge) break; // Stop if no connected edge is found
    }

    if (polygon.length >= 3) polygons.push(polygon); // Ensure valid polygon with at least 3 vertices
  }

  return polygons;
}

// Function to triangulate the sliced polygon vertices
function triangulatePolygon(vertices: Vector3[], plane: Plane) {
  // Project vertices to the plane
  const projectedVertices = projectVerticesToPlane(vertices, plane);

  // Sort vertices in counter-clockwise order
  const sortedVertices = sortVertices(projectedVertices);

  // Convert the sorted 2D vertices back to flat array
  const flatVertices: number[] = [];
  sortedVertices.forEach((v) => {
    flatVertices.push(v.x, v.y);
  });

  // Use earcut to triangulate the 2D polygon (returns an array of indices)
  const indices = earcut(flatVertices);

  // Create geometry for the triangulated result
  const geometry = new BufferGeometry();
  const positions: number[] = [];

  vertices.forEach((v) => {
    positions.push(v.x, v.y, v.z);
  });

  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positions), 3)
  );
  geometry.setIndex(indices);

  return geometry;
}

function projectVerticesToPlane(vertices: Vector3[], plane: Plane) {
  // Choose a reference point on the plane (e.g., centroid)
  const planeOrigin = vertices
    .reduce((sum, v) => sum.add(v), new Vector3())
    .divideScalar(vertices.length);

  // Define local 2D coordinate system on the plane
  const N = plane.normal.clone().normalize();
  let T = new Vector3(1, 0, 0);

  // Ensure T is not parallel to N
  if (Math.abs(N.dot(T)) > 0.9) {
    T.set(0, 1, 0);
  }

  const U = new Vector3().crossVectors(N, T).normalize(); // First tangent
  const V = new Vector3().crossVectors(N, U).normalize(); // Second tangent

  // Project each vertex to 2D space in the plane
  return vertices.map((v) => {
    const relativePos = v.clone().sub(planeOrigin);
    return new Vector2(relativePos.dot(U), relativePos.dot(V));
  });
}

function sortVertices(vertices: Vector2[]) {
  const centroid = new Vector2(0, 0);

  // Compute the centroid of the vertices
  vertices.forEach((v) => centroid.add(v));
  centroid.divideScalar(vertices.length);

  // Sort vertices by the angle with the centroid
  vertices.sort((a, b) => {
    return (
      Math.atan2(a.y - centroid.y, a.x - centroid.x) -
      Math.atan2(b.y - centroid.y, b.x - centroid.x)
    );
  });

  return vertices;
}

// Function to find the intersection point between an edge and a plane
function intersectEdge(v1: Vector3, v2: Vector3, d1: number, d2: number) {
  const t = d1 / (d1 - d2);
  return new Vector3(
    v1.x + t * (v2.x - v1.x),
    v1.y + t * (v2.y - v1.y),
    v1.z + t * (v2.z - v1.z)
  );
}
