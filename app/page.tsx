import { Map } from "./components/Map";
import { Form } from "./components/Form";
import { MapSceneProvider } from "./providers/map-scene-provider";

export default function Home() {
  return (
    <div className="w-screen h-screen">
      <main className="h-screen">
        <MapSceneProvider>
          <div className="flex h-full">
            <div className="flex-1">
              <Map></Map>
            </div>
            <div className="w-[480px] p-4 flex flex-col items-center">
              <Form></Form>
            </div>
          </div>
        </MapSceneProvider>
      </main>
    </div>
  );
}
