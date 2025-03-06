"use client";

import { useContext, useEffect, useRef } from "react";
import { MapScene } from "../three/MapScene";
import {
  MapSceneContext,
  MapSceneContextType,
} from "../providers/map-scene-provider";

export function Map() {
  const divRef = useRef<HTMLDivElement>(null);
  const { setMapScene } = useContext(MapSceneContext) as MapSceneContextType;

  useEffect(() => {
    let ignore = false;
    if (!divRef.current) return;

    async function loadScene() {
      if (divRef.current) {
        const _mapScene = await MapScene.create(divRef.current, "20");
        if (_mapScene) {
          setMapScene(_mapScene);
        }
      }
    }

    if (!ignore) {
      loadScene();
    }

    return () => {
      ignore = true;
    };
  }, [divRef]);

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <div className="w-full h-full" ref={divRef}></div>
    </div>
  );
}
