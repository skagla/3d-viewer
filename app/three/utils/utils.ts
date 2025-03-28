import { Vector3 } from "three";
import { Extent } from "./build-scene";
import { unpackEdges, unpackVertices } from "./decoders";
import proj4 from "proj4";

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
  try {
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
  } catch (e) {
    console.log(e);
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

// Transformation from EPSG 3034 to EPSG 3857
const SOURCE = "EPSG:3034";
const PROJ_STRING =
  "+proj=lcc +lat_0=52 +lon_0=10 +lat_1=35 +lat_2=65 +x_0=4000000 +y_0=2800000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs";
const DEST = "EPSG:3857";
proj4.defs(SOURCE, PROJ_STRING);
export function transform(p: number[]) {
  return proj4(SOURCE, DEST, p);
}
