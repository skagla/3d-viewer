import { AmbientLight, DirectionalLight, Scene } from "three";

const DEG2RAD = Math.PI / 180;
export function buildDefaultLights(scene: Scene) {
  // ambient light
  scene.add(new AmbientLight(0x999999));

  // directional lights
  const opt = {
    azimuth: 220,
    altitude: 45,
  };

  const lambda = (90 - opt.azimuth) * DEG2RAD;
  const phi = opt.altitude * DEG2RAD;

  const x = Math.cos(phi) * Math.cos(lambda);
  const y = Math.cos(phi) * Math.sin(lambda);
  const z = Math.sin(phi);

  const light1 = new DirectionalLight(0xffffff, 0.5);
  light1.position.set(x, y, z);
  scene.add(light1);

  // thin light from the opposite direction
  const light2 = new DirectionalLight(0xffffff, 0.1);
  light2.position.set(-x, -y, -z);
  scene.add(light2);
}
