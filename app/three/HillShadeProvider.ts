import { MapProvider } from "geo-three";

export class HillShadeProvider extends MapProvider {
  constructor() {
    super();
  }

  fetchTile(zoom: number, x: number, y: number) {
    return new Promise((resolve, reject) => {
      const image = document.createElement("img");
      image.onload = function () {
        resolve(image);
      };
      image.onerror = reject;
      image.crossOrigin = "anonymous";
      image.src = `https://server.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/${zoom}/${y}/${x}`;
      //image.src = `https://api.maptiler.com/tiles/hand-drawn-hillshade/${zoom}/${x}/${y}.webp?key=1JkD1W8u5UM5Tjd8r3Wl`;
    });
  }
}
