import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  Plane,
} from "three";

import { uniforms } from "./uniforms";
import { shader } from "./shader";

import { fetchTriangleIndices } from "./fetch-triangle-indices";
import { fetchVertices } from "./fetch-vertices";
import { TRIANGLE_INDICES_URL, VERTICES_URL } from "../config";

interface MappedFeature {
  featuregeom_id: number;
  name: string;
  geologicdescription: { "feature type": string; citation: string | null };
  preview: { legend_color: string; legend_text: string };
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
    metalness: 0.1,
    roughness: 0.75,
    flatShading: true,
    side: DoubleSide,
    wireframe: false,
    clipIntersection: false,
  });

  // material.onBeforeCompile = (materialShader) => {
  //   materialShader.uniforms.clippingLow = uniforms.clipping.clippingLow;
  //   materialShader.uniforms.clippingHigh = uniforms.clipping.clippingHigh;
  //   materialShader.uniforms.clippingScale = uniforms.clipping.clippingScale;

  //   materialShader.vertexShader = shader.vertexMeshStandard;
  //   materialShader.fragmentShader = shader.fragmentClippingMeshStandard;
  // };

  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  mesh.userData.layerId = geomId;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

export async function buildMeshes(mappedFeatures: MappedFeature[]) {
  const meshes = [];
  for (let i = 0; i < mappedFeatures.length; i++) {
    const layerData = mappedFeatures[i];
    if (layerData.name !== "Topography") {
      const mesh = await buildMesh(layerData);
      meshes.push(mesh);
    }
  }

  return meshes;
}
