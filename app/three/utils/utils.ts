import { Vector3 } from "three";
import { Extent } from "./build-scene";
import { unpackEdges, unpackVertices } from "./parsers";

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

export async function request(url: string) {
  const response = await fetch(url);
  if (response.ok) {
    return response.arrayBuffer();
  } else {
    throw new Error("HTTP error status: " + response.status);
  }
}

export async function fetchTriangleIndices(edgeUrl: string, geomId: string) {
  const url = edgeUrl + geomId;
  const buffer = await request(url);
  return unpackEdges(buffer);
}

export async function fetchVertices(pointUrl: string, geomId: string) {
  const url = pointUrl + geomId;
  const buffer = await request(url);
  return unpackVertices(buffer);
}
