import { BufferAttribute, BufferGeometry, Group, Mesh, Color, Scene } from "three";

import { fetchVertices, fetchTriangleIndices, transform } from "./utils";
import { TRIANGLE_INDICES_URL, VERTICES_URL } from "../config";
import { TriplanarShaderFactory } from "../materials/TriplanarShaderFactory";


export async function buildMeshes(
  mappedFeatures: MappedFeature[],
  model: Group,
  scene: Scene
) {
  for (const mappedFeature of mappedFeatures) {
    const mesh = await buildMesh(mappedFeature, scene);
    if (mappedFeature.name === "Topography") {
      mesh.visible = false;
    }

    model.add(mesh);
  }
}

async function buildMesh(layerData: MappedFeature, scene: Scene) {
  const color = `#${layerData.preview.legend_color}`;
  const name = layerData.preview.legend_text;
  const geomId = layerData.featuregeom_id.toString();

  const geometry = new BufferGeometry();
  const vertices = await fetchVertices(VERTICES_URL, geomId);

  // Transform coordinates to EPSG 3857
  const vertices3857 = new Float32Array(vertices.length);

  // Reduce coordinate precision
  for (let i = 0; i < vertices.length; i += 3) {
    const vertex = Array.from(vertices.slice(i, i + 3));
    vertices3857.set(
      transform(vertex).map((c) => parseInt(c.toFixed(0))),
      i
    );
  }

  const positions = new BufferAttribute(vertices3857, 3);
  geometry.setAttribute("position", positions);

  const indexArray = await fetchTriangleIndices(TRIANGLE_INDICES_URL, geomId);
  const indices = new BufferAttribute(indexArray, 1);

  geometry.setIndex(indices);

  //compute vertex normals
  geometry.computeVertexNormals();
  geometry.normalizeNormals();

  //build triplanar shader material
  const material = TriplanarShaderFactory();

  //set color
  const hexNumber = parseInt(color.replace("#", "0x"), 16);
  material.color = new Color().setHex(hexNumber);

  const mesh = new Mesh(geometry, material);

  mesh.name = name;
  mesh.userData.layerId = geomId;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}
