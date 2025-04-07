import {
  DataArrayTexture,
  LinearFilter,
  RGBAFormat,
  ShaderChunk,
  ShaderMaterial,
  Texture,
  Vector4,
} from "three";

export interface TileData {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  x: number;
  y: number;
  zoom: number;
  texture: Texture;
}

const maxTiles = 48;
const width = 256;
const height = 256;
const size = width * height;

const canvas = new OffscreenCanvas(width, height);
const ctx = canvas.getContext("2d");

const tileBounds = Array(maxTiles).fill(new Vector4(0, 0, 0, 0));

const data = new Uint8Array(4 * size * maxTiles);
const tileCache: {
  [key: string]: {
    imageData: Uint8ClampedArray;
  };
} = {};

const dataArrayTexture = new DataArrayTexture(data, width, height, maxTiles);
dataArrayTexture.format = RGBAFormat;
dataArrayTexture.generateMipmaps = false;
dataArrayTexture.magFilter = LinearFilter;
dataArrayTexture.minFilter = LinearFilter;
dataArrayTexture.needsUpdate = true;

// Create shader material
export const shaderMaterial = new ShaderMaterial({
  uniforms: {
    tileBounds: { value: tileBounds },
    tileCount: { value: maxTiles },
    tiles: { value: dataArrayTexture },
  },
  vertexShader:
    ShaderChunk.common +
    "\n" +
    ShaderChunk.logdepthbuf_pars_vertex +
    `
        varying vec3 vWorldPosition;
        varying float fragDepth;

        void main() {
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            fragDepth = (gl_Position.z / gl_Position.w + 1.0) * 0.5;
        
    ` +
    ShaderChunk.logdepthbuf_vertex +
    `
  }
`,
  fragmentShader:
    ShaderChunk.logdepthbuf_pars_fragment +
    `
        uniform vec4 tileBounds[${maxTiles}];
        uniform int tileCount;
        uniform sampler2DArray tiles;
        varying vec3 vWorldPosition;
        varying float fragDepth;

        void main() {
            vec4 color = vec4(191.0/255.0, 209.0/255.0, 229.0/255.0, 1.0); // Default color

            for (int i = 0; i < ${maxTiles}; i++) {
                if (i >= tileCount) break; // Only process available tiles

                vec4 bounds = tileBounds[i];

                if (vWorldPosition.x >= bounds.x && vWorldPosition.x <= bounds.y &&
                    vWorldPosition.y >= bounds.z && vWorldPosition.y <= bounds.w) {
                    
                    vec2 uv = (vWorldPosition.xy - bounds.xz) / (bounds.yw - bounds.xz);
                    uv = vec2(uv.x, 1.0 - uv.y);
                    color = texture2D(tiles, vec3(uv, i));

                    break; // Stop checking once we find the correct tile
                }
              }

            gl_FragColor = color;
            gl_FragDepth = fragDepth;
    ` +
    ShaderChunk.logdepthbuf_fragment +
    `
  }
`,
});

export function updateTiles(newTiles: TileData[]) {
  if (newTiles.length > maxTiles) {
    newTiles = newTiles.slice(0, maxTiles);
  }

  for (let i = 0; i < newTiles.length; i++) {
    updateDataArrayTexture(newTiles[i], i);
  }

  dataArrayTexture.needsUpdate = true;
}

// Update buffer
function updateDataArrayTexture(tileData: TileData, index: number) {
  const k = getTileDataKey(tileData);
  const cachedData = tileCache[k]?.imageData;

  if (cachedData) {
    tileBounds[index] = getTileBounds(tileData);
    data.set(cachedData, index * size * 4);
  } else {
    const imageData = getImageData(tileData.texture);

    if (imageData) {
      // Update cache and buffer
      tileCache[k] = { imageData };
      tileBounds[index] = getTileBounds(tileData);
      data.set(imageData, index * size * 4);
    }
  }
}

function getTileDataKey(t: TileData) {
  return `${t.zoom}/${t.x}/${t.y}`;
}

function getTileBounds(t: TileData) {
  return new Vector4(t.xmin, t.xmax, t.ymin, t.ymax);
}

// Create a canvas and draw the image on it
function getImageData(texture: Texture) {
  const image = texture.source.data;

  // Draw the image onto the canvas
  if (ctx) {
    ctx.drawImage(image, 0, 0);

    // Get the pixel data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data;
  } else {
    return null;
  }
}
