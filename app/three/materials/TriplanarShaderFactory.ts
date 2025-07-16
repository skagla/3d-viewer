import {
  DoubleSide,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from "three";

export function TriplanarShaderFactory(): MeshStandardMaterial {
  const textureLoader = new TextureLoader();
  const _texture_sand = textureLoader.load("/3d-viewer/textures/white_texture.jpg");
  _texture_sand.colorSpace = SRGBColorSpace;
  _texture_sand.wrapS = RepeatWrapping;
  _texture_sand.wrapT = RepeatWrapping;

  const material = new MeshStandardMaterial({
    onBeforeCompile: (shader) => {
      // vertexShader
      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
    /*glsl*/`
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
	   `);

      shader.vertexShader = shader.vertexShader.replace(
        '#include <color_vertex>',
      /*glsl*/`
	    #include <color_vertex>
	     vPosition = position;
       vNormal = normal;
      `);


      // fragmentShader
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
      /*glsl*/`
      #include <common>
      varying vec3 vPosition;
      varying vec3 vNormal;
      `);

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
    /*glsl*/  `
   
    float blendValue = 15.0;
    float tile = 0.0001;

    //calculate blend
    vec3 blend = abs(vNormal);
    blend = pow(blend, vec3(blendValue));
    blend /= dot(blend, vec3(1.0));

    //calculate textures for sides
    vec4 xAxis = texture2D(map, vPosition.yz * tile);
    vec4 yAxis = texture2D(map, vPosition.xz * tile);
    vec4 zAxis = texture2D(map, vPosition.xy * tile);
    
    vec4 blendedTextureColor= xAxis * blend.x + yAxis * blend.y + zAxis * blend.z;
    
    
    diffuseColor *= blendedTextureColor;
    `
      );

      // console.log("vertexShader");
      // console.log(shader.vertexShader);
      // console.log("fragment");
      // console.log(shader.fragmentShader);
    },

    metalness: 0.1,
    roughness: 0.5,
    flatShading: true,
    side: DoubleSide,
    wireframe: false,
    // map: _texture_sand,
    // color: new Color(1.0, 1.0, 0.0),
    // color: new Color().set(color),
  });
  material.map = _texture_sand;

  return material;
}

