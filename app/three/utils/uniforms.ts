import { Vector3, Color } from "three";

export const uniforms = {
  clipping: {
    // light blue
    color: { value: new Color(0x3d9ecb) },
    clippingLow: { value: new Vector3(0, 0, 0) },
    clippingHigh: { value: new Vector3(0, 0, 0) },
    // additional parameter for scaling
    clippingScale: { value: 1.0 },
    // topography
    map: { value: null },
    percent: { value: 1 },
  },
  caps: {
    // red
    color: { value: new Color(0xf83610) },
  },
};
