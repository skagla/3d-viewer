"use client";

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useState,
} from "react";

import { SceneView } from "../three/SceneView";

// Declare SceneView context
export type SceneViewContextType = {
  sceneView: SceneView | null;
  setSceneView: Dispatch<SetStateAction<SceneView | null>>;
};

// Context for SceneView
export const SceneViewContext = createContext<SceneViewContextType | null>(
  null
);

// Context provider for SceneView
export const SceneViewProvider = ({ children }: { children: ReactNode }) => {
  const [sceneView, setSceneView] = useState<SceneView | null>(null);

  return (
    <SceneViewContext.Provider
      value={{
        sceneView: sceneView,
        setSceneView: setSceneView,
      }}
    >
      {children}
    </SceneViewContext.Provider>
  );
};
