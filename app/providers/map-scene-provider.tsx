"use client";

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useState,
} from "react";

import { MapScene } from "../three/MapScene";

// Declare MapScene context
export type MapSceneContextType = {
  mapScene: MapScene | null;
  setMapScene: Dispatch<SetStateAction<MapScene | null>>;
};

// Context for MapScene
export const MapSceneContext = createContext<MapSceneContextType | null>(null);

// Context provider for MapScene
export const MapSceneProvider = ({ children }: { children: ReactNode }) => {
  const [mapScene, setMapScene] = useState<MapScene | null>(null);

  return (
    <MapSceneContext.Provider
      value={{
        mapScene: mapScene,
        setMapScene: setMapScene,
      }}
    >
      {children}
    </MapSceneContext.Provider>
  );
};
