"use client";

import { Map } from "./components/Map";
import { Form } from "./components/Form";
import { SceneViewProvider } from "./providers/scene-view-provider";
import { useState } from "react";
import { ResetView } from "./components/ResetView";

export default function Home() {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  return (
    <div className="w-screen h-screen">
      <main className="h-screen">
        <SceneViewProvider>
          <div className="sm:hidden p-4 bg-white dark:bg-gray-700 shadow-md flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-400">
              3D-Viewer
            </span>
            <button
              onClick={() => setIsFormOpen(true)}
              className="text-3xl hover:cursor-pointer text-gray-700 dark:text-gray-400"
            >
              ☰
            </button>
          </div>
          <div className="flex-1 flex min-h-0 h-full">
            <div className="relative flex-1">
              <div className="hidden sm:block absolute top-2 right-2">
                <ResetView></ResetView>
              </div>
              <Map></Map>
            </div>
            <div
              className={`fixed sm:static inset-0 flex flex-col gap-1 items-center bg-white dark:bg-gray-700 p-2 sm:border-l border-gray-200 shadow-lg transition-transform duration-300 w-full sm:w-[350px] xl:w-[480px] ${
                isFormOpen ? "translate-x-0" : "translate-x-full"
              } sm:translate-x-0`}
            >
              <button
                className="sm:hidden self-end text-gray-500 text-3xl hover:cursor-pointer p-1"
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
