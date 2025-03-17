"use client";

import { Map } from "./components/Map";
import { Form } from "./components/Form";
import { SceneViewProvider } from "./providers/scene-view-provider";
import { useState } from "react";

export default function Home() {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  return (
    <div className="w-screen h-screen">
      <main className="h-screen flex flex-col">
        <SceneViewProvider>
          <div className="sm:hidden p-4 bg-white shadow-md flex justify-between items-center">
            <span className="text-lg font-semibold">3D-Viewer</span>
            <button
              onClick={() => setIsFormOpen(true)}
              className="text-3xl hover:cursor-pointer"
            >
              ☰
            </button>
          </div>
          <div className="flex-1 flex min-h-0">
            <div className="flex-1">
              <Map></Map>
            </div>
            <div
              className={`fixed inset-0 bg-white p-2 flex flex-col items-center border-l border-gray-200 shadow-lg transition-transform duration-300 sm:static w-full sm:w-[350px] xl:w-[480px] sm:translate-x-0 ${
                isFormOpen ? "translate-x-0" : "translate-x-full"
              } sm:translate-x-0`}
            >
              <button
                className="self-end text-gray-500 sm:hidden text-3xl hover:cursor-pointer mb-1 mr-1"
                onClick={() => setIsFormOpen(false)}
              >
                ✖
              </button>
              <Form />
            </div>
          </div>
        </SceneViewProvider>
      </main>
    </div>
  );
}
