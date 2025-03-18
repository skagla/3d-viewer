import { useContext } from "react";
import {
  SceneViewContext,
  SceneViewContextType,
} from "../providers/scene-view-provider";

export function ResetView() {
  const { sceneView } = useContext(SceneViewContext) as SceneViewContextType;
  const handleClick = () => {
    if (!sceneView) return;

    sceneView.resetView();
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center justify-center w-10 h-10 text-white text-3xl  bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg p-2 pb-3.5 dark:bg-blue-400 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 hover:cursor-pointer"
    >
      <span className="inline-block">⌂</span>
    </button>
  );
}
