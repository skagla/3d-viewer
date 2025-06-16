import { MapProvider } from "geo-three";
import { VectorTile } from "@mapbox/vector-tile";
import Protobuf from "pbf";
import Point from "@mapbox/point-geometry";

export class HillShadeProvider extends MapProvider {
  constructor() {
    super();
  }

  fetchTile(zoom: number, x: number, y: number) {
    return new Promise((resolve, reject) => {
      const image = document.createElement("img");
      image.onload = function () {
        //resolve(image);
        fetchVectorTile(zoom, x, y, image, resolve);
      };
      image.onerror = reject;
      image.crossOrigin = "anonymous";
      image.src = `https://server.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/${zoom}/${y}/${x}`;
    });
  }
}

export async function fetchVectorTile(
  zoom: number,
  x: number,
  y: number,
  image: HTMLImageElement,
  resolve: (value: HTMLImageElement) => void
) {
  const response = await fetch(
    `https://gis.geosphere.at/base/ts/world_topo/${zoom}/${x}/${y}`
  );

  if (response.ok) {
    const data = await response.arrayBuffer();
    const tile = new VectorTile(new Protobuf(new Uint8Array(data)));
    const canvas = new OffscreenCanvas(256, 256);
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.imageSmoothingEnabled = true;

    context.drawImage(image, 0, 0);

    // Draw major roads
    let layer = tile?.layers["roads"];
    if (layer) {
      const scale = image.width / layer.extent;
      for (let i = 0; i < layer.length; i++) {
        const feature = layer.feature(i);

        if (
          feature.properties.kind === "highway" ||
          feature.properties.kind === "major_road"
        ) {
          const geometry = feature.loadGeometry();
          // Draw on canvas
          drawLineGeometry(context, geometry, scale);
        }
      }
    }

    layer = tile?.layers["places"];
    if (layer) {
      const scale = image.width / layer.extent;
      for (let i = 0; i < layer.length; i++) {
        const feature = layer.feature(i);
        if (
          feature.properties.kind_detail === "state" ||
          feature.properties.kind_detail === "town"
        ) {
          const geometry = feature.loadGeometry();
          // Draw on canvas
          drawPointGeometry(context, geometry, scale);
        }
      }
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const image = document.createElement("img");
      image.onload = function () {
        resolve(image);
      };

      // convert image file to base64 string
      if (reader.result && typeof reader.result === "string") {
        image.src = reader.result;
      }
    });

    const blob = await canvas.convertToBlob({ type: "image/png" });
    reader.readAsDataURL(blob);
  } else {
    resolve(image);
  }
}

function drawPointGeometry(
  ctx: OffscreenCanvasRenderingContext2D,
  geometry: Point[][],
  scale: number
) {
  ctx.beginPath();
  ctx.fillStyle = "black";
  const width = 10;
  const height = 10;
  for (const point of geometry) {
    const [centerX, centerY] = [point[0].x * scale, point[0].y * scale];
    ctx.fillRect(centerX - width * 0.5, centerY - height * 0.5, width, height);
  }
}

function drawLineGeometry(
  ctx: OffscreenCanvasRenderingContext2D,
  geometry: Point[][],
  scale: number
) {
  ctx.beginPath();
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  for (const line of geometry) {
    const [startX, startY] = [line[0].x * scale, line[0].y * scale];
    ctx.moveTo(startX, startY);

    for (let j = 1; j < line.length; j++) {
      const { x, y } = line[j];
      ctx.lineTo(x * scale, y * scale);
    }
  }
  ctx.stroke();
}
