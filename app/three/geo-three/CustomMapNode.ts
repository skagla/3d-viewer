import {
  BufferGeometry,
  Intersection,
  MeshBasicMaterial,
  MultiplyBlending,
  Raycaster,
  Vector3,
} from "three";
import { MapNode, MapPlaneNode, MapView, QuadTreePosition } from "geo-three";
import { MapNodeGeometry } from "geo-three";
import { UnitsUtils } from "geo-three";

export class CustomMapNode extends MapNode {
  public constructor(
    parentNode = null,
    mapView: MapView | null = null,
    location = QuadTreePosition.root,
    level = 0,
    x = 0,
    y = 0
  ) {
    super(
      parentNode ?? undefined,
      mapView ?? undefined,
      location,
      level,
      x,
      y,
      MapPlaneNode.geometry,
      new MeshBasicMaterial({
        wireframe: false,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: MultiplyBlending,
      })
    );

    this.matrixAutoUpdate = false;
    this.isMesh = true;
    this.visible = false;
  }

  public static geometry: BufferGeometry = new MapNodeGeometry(
    1,
    1,
    1,
    1,
    false
  );

  public static baseGeometry: BufferGeometry = MapPlaneNode.geometry;

  public static baseScale: Vector3 = new Vector3(
    UnitsUtils.EARTH_PERIMETER,
    1.0,
    UnitsUtils.EARTH_PERIMETER
  );

  public async initialize(): Promise<void> {
    super.initialize();

    await this.loadData();

    this.nodeReady();
  }

  public createChildNodes(): void {
    const level = this.level + 1;
    const x = this.x * 2;
    const y = this.y * 2;

    const Constructor = Object.getPrototypeOf(this).constructor;

    let node = new Constructor(
      this,
      this.mapView,
      QuadTreePosition.topLeft,
      level,
      x,
      y
    );
    node.scale.set(0.5, 1.0, 0.5);
    node.position.set(-0.25, 0, -0.25);
    this.add(node);
    node.updateMatrix();
    node.updateMatrixWorld(true);

    node = new Constructor(
      this,
      this.mapView,
      QuadTreePosition.topRight,
      level,
      x + 1,
      y
    );
    node.scale.set(0.5, 1.0, 0.5);
    node.position.set(0.25, 0, -0.25);
    this.add(node);
    node.updateMatrix();
    node.updateMatrixWorld(true);

    node = new Constructor(
      this,
      this.mapView,
      QuadTreePosition.bottomLeft,
      level,
      x,
      y + 1
    );
    node.scale.set(0.5, 1.0, 0.5);
    node.position.set(-0.25, 0, 0.25);
    this.add(node);
    node.updateMatrix();
    node.updateMatrixWorld(true);

    node = new Constructor(
      this,
      this.mapView,
      QuadTreePosition.bottomRight,
      level,
      x + 1,
      y + 1
    );
    node.scale.set(0.5, 1.0, 0.5);
    node.position.set(0.25, 0, 0.25);
    this.add(node);
    node.updateMatrix();
    node.updateMatrixWorld(true);
  }

  public raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    if (this.isMesh === true) {
      super.raycast(raycaster, intersects);
    }
  }
}
