"use client";

import { useContext, useEffect, useRef } from "react";
import {
  SceneViewContext,
  SceneViewContextType,
} from "../providers/scene-view-provider";

async function lazyLoad() {
  const { SceneView } = await import("../three/SceneView");
  return SceneView;
}

export function Map() {
  const divRef = useRef<HTMLDivElement>(null);
  const { setSceneView } = useContext(SceneViewContext) as SceneViewContextType;

  useEffect(() => {
    let ignore = false;
    if (!divRef.current) return;

    async function loadScene() {
      if (divRef.current) {
        const SceneView = await lazyLoad();
        const _sceneView = await SceneView.create(divRef.current, "20");
        if (_sceneView) {
          setSceneView(_sceneView);
        }
      }
    }

    if (!ignore) {
      loadScene();
    }

    return () => {
      ignore = true;
    };
  }, [divRef, setSceneView]);

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <div className="w-full h-full" ref={divRef}></div>
    </div>
  );
}
