import {
  BufferGeometry,
  CanvasTexture,
  Group,
  Line,
  LineBasicMaterial,
  Sprite,
  SpriteMaterial,
  Vector3,
} from "three";
import { Extent } from "./build-scene";

enum Orientation {
  X,
  Y,
  Z,
}

export function buildCoordinateGrid(extent: Extent) {
  // Calculate the width and height of the grid
  const gridWidth = extent.xmax - extent.xmin;
  const gridHeight = extent.ymax - extent.ymin;

  // Decide on the number of divisions
  const divisions = 10;

  const xOffset = gridWidth / divisions;
  let x = extent.xmin - xOffset;
  const xPairs = [];
  for (let i = 0; i < divisions + 1; i++) {
    x += xOffset;
    const start = new Vector3(x, extent.ymin, extent.zmin);
    const end = new Vector3(x, extent.ymax, extent.zmin);
    xPairs.push([start, end]);
  }
  const xLines = createLines(xPairs);

  const yOffset = gridHeight / divisions;
  let y = extent.ymin - yOffset;
  const yPairs = [];
  for (let i = 0; i < divisions + 1; i++) {
    y += yOffset;
    const start = new Vector3(extent.xmin, y, extent.zmin);
    const end = new Vector3(extent.xmax, y, extent.zmin);
    yPairs.push([start, end]);
  }
  const yLines = createLines(yPairs);

  const annotations = [];
  for (let i = 0; i < xPairs.length - 1; i++) {
    const [start, _] = xPairs[i];
    const label = createLabel(`${start.x.toFixed(0)}m`, start, Orientation.X);
    annotations.push(label);
  }

  for (let i = 0; i < yPairs.length - 1; i++) {
    const [start, _] = yPairs[i];
    const label = createLabel(`${start.y.toFixed(0)}m`, start, Orientation.Y);
    annotations.push(label);
  }

  const gridHelper = new Group();
  gridHelper.add(...xLines, ...yLines);

  return { gridHelper, annotations };
}

export function buildHeightGrid(extent: Extent) {
  const gridHeight = extent.zmax - extent.zmin;

  const divisions = 5;
  const offset = gridHeight / divisions;

  let z = extent.zmin - offset;
  const pointPairs = [];
  for (let i = 0; i < divisions + 1; i++) {
    z += offset;
    const start = new Vector3(extent.xmax, extent.ymin, z);
    const end = new Vector3(extent.xmax, extent.ymax, z);
    pointPairs.push([start, end]);
  }
  const lines = createLines(pointPairs);

  const annotations = [];
  for (const pointPair of pointPairs) {
    const start = pointPair[0];
    const label = createLabel(`${start.z.toFixed(0)}m`, start, Orientation.Z);
    annotations.push(label);
  }

  const gridHelper = new Group();
  gridHelper.add(...lines);

  return { heightGridHelper: gridHelper, heightAnnotations: annotations };
}

// Function to create annotation (sprite with text)
function createLabel(
  text: string,
  position: Vector3,
  orientation: Orientation
) {
  const spriteMaterial = new SpriteMaterial({
    map: new CanvasTexture(generateTextCanvas(text)), // Create text texture
    transparent: true,
  });
  const sprite = new Sprite(spriteMaterial);

  // Set position according to axis orientation
  if (orientation === Orientation.X) {
    sprite.position.set(position.x + 500, position.y - 1500, position.z + 500);
  } else if (orientation === Orientation.Y) {
    sprite.position.set(position.x - 3000, position.y + 500, position.z + 500);
  } else {
    sprite.position.set(position.x + 3000, position.y, position.z + 500);
  }
  sprite.scale.set(5000, 2500, 1);
  return sprite;
}

// Function to generate a text canvas for the annotation
function generateTextCanvas(text: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (context) {
    const width = 800;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    // Set the text style
    context.font = `${height - 30}px Arial`;
    context.fillStyle = "black";

    context.fillText(text, 0, height - 15);
  }

  return canvas;
}

function createLines(pointPairs: Vector3[][]) {
  const lines = [];

  for (const pair of pointPairs) {
    const geometry = new BufferGeometry().setFromPoints(pair);

    // Line material
    const material = new LineBasicMaterial({ color: 0x444444 });

    // Create line
    const line = new Line(geometry, material);
    lines.push(line);
  }

  return lines;
}
