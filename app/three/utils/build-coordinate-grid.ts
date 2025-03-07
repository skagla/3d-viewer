import {
  CanvasTexture,
  GridHelper,
  Sprite,
  SpriteMaterial,
  Vector4,
} from "three";
import { Extent } from "./build-scene";
import { getCenter3D } from "./utils";

enum Orientation {
  Horizontal,
  Vertical,
}

export function buildCoordinateGrid(extent: Extent) {
  const center = getCenter3D(extent);
  // Calculate the width and height of the grid
  const gridWidth = extent.xmax - extent.xmin;
  const gridHeight = extent.ymax - extent.ymin;

  // Decide on the number of divisions (e.g., 20 divisions along each axis)
  const divisions = 20;

  // Create a grid helper with the calculated grid size and divisions
  const gridHelper = new GridHelper(Math.max(gridWidth, gridHeight), divisions);

  // Position the grid in the scene to match the given extent
  gridHelper.position.set(center.x, center.y, 0);

  // Rotate the grid to align with the XY-plane
  gridHelper.rotation.x = Math.PI / 2;

  // Retrieve the geometry of the grid helper
  const geometry = gridHelper.geometry;

  const positionAttr = geometry.getAttribute("position");
  const startingPointsHorizontal = [];
  const startingPointsVertical = [];
  for (let i = 0; i < positionAttr.count; i++) {
    const x = positionAttr.getX(i);
    const z = positionAttr.getZ(i);
    const v = new Vector4(x + center.x, z + center.y, 0, 1);

    if (i % 4 === 0) {
      startingPointsVertical.push(v);
    } else if (i % 2 == 0) {
      startingPointsHorizontal.push(v);
    }
  }

  const annotations = [];
  for (let point of startingPointsHorizontal) {
    const label = createLabel(
      `${point.x.toFixed(2)}`,
      point,
      Orientation.Horizontal
    );
    annotations.push(label);
  }

  for (let point of startingPointsVertical) {
    const label = createLabel(
      `${point.y.toFixed(2)}`,
      point,
      Orientation.Vertical
    );
    annotations.push(label);
  }

  return { gridHelper, annotations };
}

// Function to create annotation (sprite with text)
function createLabel(
  text: string,
  position: Vector4,
  orientation: Orientation
) {
  const spriteMaterial = new SpriteMaterial({
    map: new CanvasTexture(generateTextCanvas(text, orientation)), // Create text texture
    transparent: true,
  });
  const sprite = new Sprite(spriteMaterial);
  sprite.position.set(position.x, position.y, position.z);
  sprite.scale.set(5000, 2500, 1); // Scale the sprite to make the text readable
  return sprite;
}

// Function to generate a text canvas for the annotation
function generateTextCanvas(text: string, orientation: Orientation) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (context) {
    canvas.width = 800;
    canvas.height = 160;

    // Set the text style
    context.font = "45px Arial";
    context.fillStyle = "black";

    if (orientation === Orientation.Horizontal) {
      context.fillText(text, 300, 160);
    } else {
      context.fillText(text, 100, 90);
    }
  }

  return canvas;
}
