import { Map } from "./components/Map";
import { Form } from "./components/Form";
import { SceneViewProvider } from "./providers/scene-view-provider";

export default function Home() {
  return (
    <div className="w-screen h-screen">
      <main className="h-screen">
        <SceneViewProvider>
          <div className="flex h-full">
            <div className="flex-1">
              <Map></Map>
            </div>
            <div className="w-[480px] p-4 flex flex-col items-center border-l border-gray-200">
              <Form></Form>
            </div>
          </div>
        </SceneViewProvider>
      </main>
    </div>
  );
}
