import { ChangeEvent, useContext, useState } from "react";
import {
  SceneViewContext,
  SceneViewContextType,
} from "../providers/scene-view-provider";

export function RangeSlider() {
  const { sceneView } = useContext(SceneViewContext) as SceneViewContextType;
  const [scale, setScale] = useState<number>(1);

  const handleChange = (e: ChangeEvent) => {
    if (!sceneView) return;
    const t = e.target as HTMLInputElement;
    const z = parseFloat(t.value);
    if (!isNaN(z)) {
      setScale(z);
      sceneView.scene.scale.set(1, 1, z);
    }
  };
  return (
    <div className="relative mb-8">
      <label
        htmlFor="steps-range"
        className="block mb-2 text-sm font-medium text-gray-500 dark:text-gray-400"
      >
        Z-Scaling
      </label>
      <input
        id="steps-range"
        type="range"
        min="1"
        max="5"
        value={scale}
        step="0.5"
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-400"
        onChange={handleChange}
      ></input>
      <span className="text-sm text-gray-500 dark:text-gray-400 absolute start-0 -bottom-6">
        1
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400 absolute start-1/8 -translate-x-1/8 -bottom-6">
        1.5
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400 absolute start-2/8 -translate-x-2/8 -bottom-6">
        2
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400 absolute start-3/8 -translate-x-3/8 -bottom-6">
        2.5
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400 absolute start-4/8 -translate-x-4/8 -bottom-6">
        3
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400 absolute start-5/8 -translate-x-5/8 -bottom-6">
        3.5
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400 absolute start-6/8 -translate-x-6/8 -bottom-6">
        4
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400 absolute start-7/8 -translate-x-7/8 -bottom-6">
        4.5
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400 absolute end-0 -bottom-6">
        5
      </span>
    </div>
  );
}
