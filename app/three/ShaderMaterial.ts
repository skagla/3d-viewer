import { ShaderMaterial, Texture, Vector4 } from "three";

export interface TileData {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  texture: Texture | null;
}

const maxTiles = 16;

// Initialize empty texture slots
const dummyTexture = new Texture();
dummyTexture.image = document.createElement("canvas");
dummyTexture.needsUpdate = true;

// Create shader material
export const shaderMaterial = new ShaderMaterial({
  uniforms: {
    tileTextures: { value: Array(maxTiles).fill(dummyTexture) },
    tileBounds: { value: Array(maxTiles).fill(new Vector4(0, 0, 0, 0)) },
    tileCount: { value: 0 },
  },
  vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
        }
    `,
  fragmentShader: `
        uniform sampler2D tileTextures[${maxTiles}];
        uniform vec4 tileBounds[${maxTiles}];
        uniform int tileCount;
        varying vec3 vWorldPosition;

        void main() {
            vec4 color = vec4(1.0, 1.0, 1.0, 1.0); // Default color

            for (int i = 0; i < ${maxTiles}; i++) {
                if (i >= tileCount) break; // Only process available tiles

                vec4 bounds = tileBounds[i];

                if (vWorldPosition.x >= bounds.x && vWorldPosition.x <= bounds.y &&
                    vWorldPosition.y >= bounds.z && vWorldPosition.y <= bounds.w) {
                    
                    vec2 uv = (vWorldPosition.xy - bounds.xz) / (bounds.yw - bounds.xz);
                    switch (i) {
                      case 0: color = texture2D(tileTextures[0], uv); break;
                      case 1: color = texture2D(tileTextures[1], uv); break;
                      case 2: color = texture2D(tileTextures[2], uv); break;
                      case 3: color = texture2D(tileTextures[3], uv); break;
                      case 4: color = texture2D(tileTextures[4], uv); break;
                      case 5: color = texture2D(tileTextures[5], uv); break;
                      case 6: color = texture2D(tileTextures[6], uv); break;
                      case 7: color = texture2D(tileTextures[7], uv); break;
                      case 8: color = texture2D(tileTextures[8], uv); break;
                      case 9: color = texture2D(tileTextures[9], uv); break;
                      case 10: color = texture2D(tileTextures[10], uv); break;
                      case 11: color = texture2D(tileTextures[11], uv); break;
                      case 12: color = texture2D(tileTextures[12], uv); break;
                      case 13: color = texture2D(tileTextures[13], uv); break;
                      case 14: color = texture2D(tileTextures[14], uv); break;
                      case 15: color = texture2D(tileTextures[15], uv); break;
                    }

                  break; // Stop checking once we find the correct tile
                }
              }

            gl_FragColor = color;
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
  shaderMaterial.uniforms.tileTextures.value = textures;
  shaderMaterial.uniforms.tileBounds.value = bounds;
  shaderMaterial.uniforms.tileCount.value = newTiles.length;
}
