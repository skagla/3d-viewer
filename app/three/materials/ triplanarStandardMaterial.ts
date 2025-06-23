import {
  Color,
  DoubleSide,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
} from "three";

export function buildTriplanarShaderMaterial(color: Color) {
  // return new MeshStandardMaterial({
  //     metalness: 0.1,
  //     roughness: 0.5,
  //     flatShading: true,
  //     side: DoubleSide,
  //     wireframe: false,
  //     color: new Color().set(color),
  // })

  const material = new ShaderMaterial({
    vertexShader: /*glsl*/ `
        #include <common>
        #include <logdepthbuf_pars_vertex>

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;


        void main(){
            vPosition = position;
            vNormal = normal;
            vUv = uv;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            #include <logdepthbuf_vertex>
        }
        `,

    fragmentShader: /*glsl*/ `
        #include <common>
        #include <logdepthbuf_pars_fragment>

        uniform sampler2D uTexture;
        uniform vec3 color;
        uniform bool uUseTexture;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        

        void main(){
            // float blendValue = 45.0;
            float blendValue = 15.0;
            float tile = 0.0001;

            //calculate blend
            vec3 blend = abs(vNormal);
            blend = pow(blend, vec3(blendValue));
            blend /= dot(blend, vec3(1.0));

            //calculate textures for sides
            vec4 xAxis = texture2D(uTexture, vPosition.yz * tile);
            vec4 yAxis = texture2D(uTexture, vPosition.xz * tile);
            vec4 zAxis = texture2D(uTexture, vPosition.xy * tile);

            #include <logdepthbuf_fragment>

             //blend unity
             vec4 blendedTextureColor= saturate(vec4(float(!uUseTexture)) + (xAxis * blend.x + yAxis * blend.y + zAxis * blend.z));
             vec4 multipliedColor = vec4(color,1) * blendedTextureColor;


            gl_FragColor = vec4(multipliedColor.xyz, 1.0);
        }
        `,
    // metalness: 0.1,
    // roughness: 0.5,
    // flatShading: true,
    side: DoubleSide,
    wireframe: false,
  });

  material.uniforms.color = { value: color };

  const textureLoader = new TextureLoader();
  const texture = textureLoader.load("/3d-viewer/textures/kalk_5pt_bg-w.jpg");
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  material.uniforms.uTexture = { value: texture };

  material.uniforms.uUseTexture = { value: false };

  return material;
}
