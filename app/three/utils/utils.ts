import { Vector3 } from "three";
import { Extent } from "./build-scene";

export function getMaxSize(extent: Extent) {
  return Math.max(
    extent.xmax - extent.xmin,
    extent.ymax - extent.ymin,
    extent.zmax - extent.zmin
  );
}

export function getCenter3D(extent: Extent) {
  return new Vector3(
    (extent.xmin + extent.xmax) / 2,
    (extent.ymin + extent.ymax) / 2,
    (extent.zmax + extent.zmin) / 2
  );
}

export async function getMetadata(serviceUrl: string) {
  const response = await fetch(serviceUrl, {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    return response.json();
  } else {
    throw new Error("HTTP error status: " + response.status);
  }
}
