import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
} from "three";

import { fetchVertices, fetchTriangleIndices } from "./utils";
import { TRIANGLE_INDICES_URL, VERTICES_URL } from "../config";

interface MappedFeature {
  featuregeom_id: number;
  name: string;
  geologicdescription: { "feature type": string; citation: string | null };
  preview: { legend_color: string; legend_text: string };
}

export async function buildMeshes(mappedFeatures: MappedFeature[]) {
  const meshes = [];
  for (let i = 0; i < mappedFeatures.length; i++) {
    const layerData = mappedFeatures[i];
    const mesh = await buildMesh(layerData);
    if (layerData.name === "Topography") {
      mesh.visible = false;
    }
    meshes.push(mesh);
  }

  return meshes;
}

async function buildMesh(layerData: MappedFeature) {
  const color = `#${layerData.preview.legend_color}`;
  const name = layerData.preview.legend_text;
  const geomId = layerData.featuregeom_id.toString();

  const geometry = new BufferGeometry();
  const vertices = await fetchVertices(VERTICES_URL, geomId);

  const positions = new BufferAttribute(vertices, 3);
  geometry.setAttribute("position", positions);

  const indexArray = await fetchTriangleIndices(TRIANGLE_INDICES_URL, geomId);
  const indices = new BufferAttribute(indexArray, 1);

  geometry.setIndex(indices);
  geometry.scale(1, 1, 1);
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  const material = new MeshStandardMaterial({
    color: color,
    metalness: 0.0,
    roughness: 0.75,
    flatShading: true,
    side: DoubleSide,
    wireframe: false,
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  mesh.userData.layerId = geomId;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}
