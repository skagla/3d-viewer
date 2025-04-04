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
  zoom: number;
  texture: Texture;
}

const maxTiles = 24;

// Initialize empty texture slots
const dummyTexture = new Texture();
dummyTexture.image = document.createElement("canvas");
dummyTexture.needsUpdate = true;

// Create shader material
export const shaderMaterial = new ShaderMaterial({
  uniforms: {
    tileBounds: { value: Array(maxTiles).fill(new Vector4(0, 0, 0, 0)) },
    tileCount: { value: 0 },
    tiles: { value: null },
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

  const textures = newTiles.map((t) => t.texture);
  const bounds = newTiles.map(
    (t) => new Vector4(t.xmin, t.xmax, t.ymin, t.ymax)
  );

  // Fill remaining slots with dummy data to maintain uniform array size
  while (textures.length < maxTiles) {
    textures.push(dummyTexture);
    bounds.push(new Vector4(0, 0, 0, 0));
  }

  // Update shader uniforms
  shaderMaterial.uniforms.tileBounds.value = bounds;
  shaderMaterial.uniforms.tileCount.value = newTiles.length;
  shaderMaterial.uniforms.tiles.value = createDataArrayTexture(textures);
}

// Create a buffer with color data
const width = 256;
const height = 256;
const size = width * height;
function createDataArrayTexture(textures: Texture[]) {
  const depth = textures.length;

  const data = new Uint8Array(4 * size * depth);

  for (let i = 0; i < depth; i++) {
    const texture = textures[i];
    const imageData = getImageData(texture);

    if (imageData) {
      data.set(imageData, i * size * 4);
    }
  }

  // Use the buffer to create a DataArrayTexture
  const texture = new DataArrayTexture(data, width, height, depth);
  texture.format = RGBAFormat;
  texture.generateMipmaps = false;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// Create a canvas and draw the image on it
const canvas = new OffscreenCanvas(width, height);
const ctx = canvas.getContext("2d");
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
